package com.grupofrontera.msauth.service;

import com.grupofrontera.msauth.dto.*;
import com.grupofrontera.msauth.entity.Credencial;
import com.grupofrontera.msauth.entity.RefreshToken;
import com.grupofrontera.msauth.repository.CredencialRepository;
import com.grupofrontera.msauth.repository.RefreshTokenRepository;
import io.quarkus.elytron.security.common.BcryptUtil;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Response;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    private static final String JWT_SECRET =
            "Y29yZGlsbGVyYV9qd3Rfc2VjcmV0X2tleV9mb3JfZGV2ZWxvcG1lbnRfZW52aXJvbm1lbnRfb25seQ==";

    @Mock
    CredencialRepository credencialRepository;

    @Mock
    RefreshTokenRepository refreshTokenRepository;

    @InjectMocks
    AuthService authService;

    @BeforeEach
    void setUp() {
        authService.jwtSecret = JWT_SECRET;
        authService.expirationHours = 1L;
        authService.refreshExpirationDays = 7L;
    }

    @Test
    void registrar_exitoso_hasheaPasswordConBcrypt() {
        RegisterRequestDTO dto = new RegisterRequestDTO();
        dto.usuarioId = UUID.randomUUID();
        dto.email = "nuevo@cordillera.cl";
        dto.password = "Password123!";

        when(credencialRepository.existePorEmail(dto.email)).thenReturn(false);

        authService.registrar(dto);

        ArgumentCaptor<Credencial> captor = ArgumentCaptor.forClass(Credencial.class);
        verify(credencialRepository).persist(captor.capture());
        Credencial persisted = captor.getValue();

        assertEquals(dto.usuarioId, persisted.usuarioRefId);
        assertEquals(dto.email, persisted.email);
        assertNotEquals(dto.password, persisted.passwordHash);
        assertTrue(BcryptUtil.matches(dto.password, persisted.passwordHash));
        assertTrue(persisted.activo);
    }

    @Test
    void registrar_emailDuplicado_lanza409() {
        RegisterRequestDTO dto = new RegisterRequestDTO();
        dto.usuarioId = UUID.randomUUID();
        dto.email = "existente@cordillera.cl";
        dto.password = "Password123!";

        when(credencialRepository.existePorEmail(dto.email)).thenReturn(true);

        WebApplicationException ex = assertThrows(WebApplicationException.class,
                () -> authService.registrar(dto));
        assertEquals(Response.Status.CONFLICT.getStatusCode(), ex.getResponse().getStatus());
        verify(credencialRepository, never()).persist(any(Credencial.class));
    }

    @Test
    void login_credencialesValidas_retornaAccessYRefreshToken() {
        String rawPassword = "Password123!";
        Credencial credencial = new Credencial();
        credencial.id = UUID.randomUUID();
        credencial.usuarioRefId = UUID.randomUUID();
        credencial.email = "admin@cordillera.cl";
        credencial.passwordHash = BcryptUtil.bcryptHash(rawPassword);
        credencial.activo = true;

        LoginRequestDTO dto = new LoginRequestDTO();
        dto.email = credencial.email;
        dto.password = rawPassword;

        when(credencialRepository.findByEmail(dto.email)).thenReturn(Optional.of(credencial));

        LoginResponseDTO resp = authService.login(dto);

        assertEquals(credencial.usuarioRefId, resp.usuarioId);
        assertEquals(credencial.email, resp.email);
        assertNotNull(resp.accessToken);
        assertEquals(3, resp.accessToken.split("\\.").length);
        assertNotNull(resp.refreshToken);
        verify(refreshTokenRepository).persist(any(RefreshToken.class));
    }

    @Test
    void login_emailNoExiste_lanza401() {
        LoginRequestDTO dto = new LoginRequestDTO();
        dto.email = "noexiste@cordillera.cl";
        dto.password = "cualquiera";

        when(credencialRepository.findByEmail(dto.email)).thenReturn(Optional.empty());

        WebApplicationException ex = assertThrows(WebApplicationException.class,
                () -> authService.login(dto));
        assertEquals(Response.Status.UNAUTHORIZED.getStatusCode(), ex.getResponse().getStatus());
    }

    @Test
    void login_usuarioInactivo_lanza401() {
        Credencial credencial = new Credencial();
        credencial.email = "inactivo@cordillera.cl";
        credencial.passwordHash = BcryptUtil.bcryptHash("clave");
        credencial.activo = false;

        LoginRequestDTO dto = new LoginRequestDTO();
        dto.email = credencial.email;
        dto.password = "clave";

        when(credencialRepository.findByEmail(dto.email)).thenReturn(Optional.of(credencial));

        WebApplicationException ex = assertThrows(WebApplicationException.class,
                () -> authService.login(dto));
        assertEquals(Response.Status.UNAUTHORIZED.getStatusCode(), ex.getResponse().getStatus());
    }

    @Test
    void login_passwordIncorrecta_lanza401() {
        Credencial credencial = new Credencial();
        credencial.email = "admin@cordillera.cl";
        credencial.passwordHash = BcryptUtil.bcryptHash("claveCorrecta");
        credencial.activo = true;

        LoginRequestDTO dto = new LoginRequestDTO();
        dto.email = credencial.email;
        dto.password = "claveIncorrecta";

        when(credencialRepository.findByEmail(dto.email)).thenReturn(Optional.of(credencial));

        WebApplicationException ex = assertThrows(WebApplicationException.class,
                () -> authService.login(dto));
        assertEquals(Response.Status.UNAUTHORIZED.getStatusCode(), ex.getResponse().getStatus());
    }

    @Test
    void refresh_tokenValido_rotaTokenYMarcaAnteriorInvalidado() {
        Credencial credencial = new Credencial();
        credencial.id = UUID.randomUUID();
        credencial.usuarioRefId = UUID.randomUUID();
        credencial.email = "admin@cordillera.cl";

        RefreshToken rt = new RefreshToken();
        rt.id = UUID.randomUUID();
        rt.credencial = credencial;
        rt.token = UUID.randomUUID().toString();
        rt.expiresAt = LocalDateTime.now().plusDays(1);
        rt.invalidado = false;

        RefreshRequestDTO dto = new RefreshRequestDTO();
        dto.refreshToken = rt.token;

        when(refreshTokenRepository.findByToken(rt.token)).thenReturn(Optional.of(rt));

        RefreshResponseDTO resp = authService.refresh(dto);

        assertTrue(rt.invalidado);
        assertNotNull(resp.accessToken);
        assertNotNull(resp.refreshToken);
        assertNotEquals(rt.token, resp.refreshToken);
        verify(refreshTokenRepository).persist(any(RefreshToken.class));
    }

    @Test
    void refresh_tokenInexistente_lanza401() {
        RefreshRequestDTO dto = new RefreshRequestDTO();
        dto.refreshToken = "no-existe";

        when(refreshTokenRepository.findByToken(dto.refreshToken)).thenReturn(Optional.empty());

        WebApplicationException ex = assertThrows(WebApplicationException.class,
                () -> authService.refresh(dto));
        assertEquals(Response.Status.UNAUTHORIZED.getStatusCode(), ex.getResponse().getStatus());
    }

    @Test
    void refresh_tokenYaInvalidado_lanza401() {
        RefreshToken rt = new RefreshToken();
        rt.credencial = new Credencial();
        rt.token = UUID.randomUUID().toString();
        rt.expiresAt = LocalDateTime.now().plusDays(1);
        rt.invalidado = true;

        RefreshRequestDTO dto = new RefreshRequestDTO();
        dto.refreshToken = rt.token;

        when(refreshTokenRepository.findByToken(rt.token)).thenReturn(Optional.of(rt));

        WebApplicationException ex = assertThrows(WebApplicationException.class,
                () -> authService.refresh(dto));
        assertEquals(Response.Status.UNAUTHORIZED.getStatusCode(), ex.getResponse().getStatus());
    }

    @Test
    void refresh_tokenExpirado_lanza401() {
        RefreshToken rt = new RefreshToken();
        rt.credencial = new Credencial();
        rt.token = UUID.randomUUID().toString();
        rt.expiresAt = LocalDateTime.now().minusMinutes(1);
        rt.invalidado = false;

        RefreshRequestDTO dto = new RefreshRequestDTO();
        dto.refreshToken = rt.token;

        when(refreshTokenRepository.findByToken(rt.token)).thenReturn(Optional.of(rt));

        WebApplicationException ex = assertThrows(WebApplicationException.class,
                () -> authService.refresh(dto));
        assertEquals(Response.Status.UNAUTHORIZED.getStatusCode(), ex.getResponse().getStatus());
    }

    @Test
    void logout_tokenExistente_marcaInvalidado() {
        RefreshToken rt = new RefreshToken();
        rt.token = UUID.randomUUID().toString();
        rt.invalidado = false;

        RefreshRequestDTO dto = new RefreshRequestDTO();
        dto.refreshToken = rt.token;

        when(refreshTokenRepository.findByToken(rt.token)).thenReturn(Optional.of(rt));

        authService.logout(dto);

        assertTrue(rt.invalidado);
    }

    @Test
    void logout_tokenInexistente_esIdempotenteNoLanza() {
        RefreshRequestDTO dto = new RefreshRequestDTO();
        dto.refreshToken = "no-existe";

        when(refreshTokenRepository.findByToken(dto.refreshToken)).thenReturn(Optional.empty());

        assertDoesNotThrow(() -> authService.logout(dto));
    }

    @Test
    void cambiarEstado_desactivar_invalidaTodosLosRefreshTokens() {
        Credencial credencial = new Credencial();
        credencial.id = UUID.randomUUID();
        credencial.usuarioRefId = UUID.randomUUID();
        credencial.activo = true;

        when(credencialRepository.findByUsuarioRefId(credencial.usuarioRefId))
                .thenReturn(Optional.of(credencial));

        authService.cambiarEstado(credencial.usuarioRefId, false);

        assertFalse(credencial.activo);
        verify(refreshTokenRepository).invalidarTodosPorCredencial(credencial.id);
    }

    @Test
    void cambiarEstado_usuarioNoEncontrado_lanza404() {
        UUID usuarioRefId = UUID.randomUUID();
        when(credencialRepository.findByUsuarioRefId(usuarioRefId)).thenReturn(Optional.empty());

        WebApplicationException ex = assertThrows(WebApplicationException.class,
                () -> authService.cambiarEstado(usuarioRefId, false));
        assertEquals(Response.Status.NOT_FOUND.getStatusCode(), ex.getResponse().getStatus());
    }

    @Test
    void validate_tokenValido_retornaClaims() {
        Credencial credencial = new Credencial();
        credencial.usuarioRefId = UUID.randomUUID();
        credencial.email = "admin@cordillera.cl";
        credencial.passwordHash = BcryptUtil.bcryptHash("clave");
        credencial.activo = true;

        LoginRequestDTO loginDto = new LoginRequestDTO();
        loginDto.email = credencial.email;
        loginDto.password = "clave";

        when(credencialRepository.findByEmail(credencial.email)).thenReturn(Optional.of(credencial));

        LoginResponseDTO loginResp = authService.login(loginDto);

        ValidateResponseDTO resp = authService.validate("Bearer " + loginResp.accessToken);

        assertTrue(resp.valido);
        assertEquals(credencial.usuarioRefId, resp.usuarioId);
        assertEquals(credencial.email, resp.email);
    }

    @Test
    void validate_tokenMalformadoOSinBearer_retornaFalseSinLanzar() {
        assertFalse(authService.validate("token-sin-prefijo-bearer").valido);
        assertFalse(authService.validate("Bearer token.invalido.aqui").valido);
        assertFalse(authService.validate(null).valido);
    }
}
