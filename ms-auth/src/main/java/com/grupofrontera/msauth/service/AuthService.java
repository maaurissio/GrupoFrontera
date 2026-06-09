package com.grupofrontera.msauth.service;

import com.grupofrontera.msauth.dto.*;
import com.grupofrontera.msauth.entity.Credencial;
import com.grupofrontera.msauth.entity.RefreshToken;
import com.grupofrontera.msauth.repository.CredencialRepository;
import com.grupofrontera.msauth.repository.RefreshTokenRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import io.quarkus.elytron.security.common.BcryptUtil;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import javax.crypto.SecretKey;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Date;
import java.util.UUID;

@ApplicationScoped
public class AuthService {

    @ConfigProperty(name = "auth.jwt.secret")
    String jwtSecret;

    @ConfigProperty(name = "auth.jwt.expiration-hours", defaultValue = "1")
    long expirationHours;

    @ConfigProperty(name = "auth.jwt.refresh-expiration-days", defaultValue = "7")
    long refreshExpirationDays;

    @Inject
    CredencialRepository credencialRepository;

    @Inject
    RefreshTokenRepository refreshTokenRepository;

    @Transactional
    public void registrar(RegisterRequestDTO dto) {
        if (credencialRepository.existePorEmail(dto.email)) {
            throw new WebApplicationException("Email ya registrado en auth", Response.Status.CONFLICT);
        }
        Credencial c = new Credencial();
        c.usuarioRefId = dto.usuarioId;
        c.email = dto.email;
        c.passwordHash = BcryptUtil.bcryptHash(dto.password);
        c.activo = true;
        c.creadoEn = LocalDateTime.now();
        c.actualizadoEn = LocalDateTime.now();
        credencialRepository.persist(c);
    }

    @Transactional
    public LoginResponseDTO login(LoginRequestDTO dto) {
        Credencial c = credencialRepository.findByEmail(dto.email)
                .orElseThrow(() -> new WebApplicationException("Credenciales inválidas", Response.Status.UNAUTHORIZED));

        if (!c.activo) {
            throw new WebApplicationException("Usuario inactivo", Response.Status.UNAUTHORIZED);
        }

        if (!BcryptUtil.matches(dto.password, c.passwordHash)) {
            throw new WebApplicationException("Credenciales inválidas", Response.Status.UNAUTHORIZED);
        }

        String accessToken = generarAccessToken(c.usuarioRefId, c.email);
        String refreshTokenStr = persistirRefreshToken(c);

        return new LoginResponseDTO(c.usuarioRefId, c.email, accessToken, refreshTokenStr);
    }

    @Transactional
    public RefreshResponseDTO refresh(RefreshRequestDTO dto) {
        RefreshToken rt = refreshTokenRepository.findByToken(dto.refreshToken)
                .orElseThrow(() -> new WebApplicationException("RefreshToken inválido", Response.Status.UNAUTHORIZED));

        if (rt.invalidado || rt.expiresAt.isBefore(LocalDateTime.now())) {
            throw new WebApplicationException("RefreshToken expirado o invalidado", Response.Status.UNAUTHORIZED);
        }

        rt.invalidado = true;

        String nuevoAccessToken = generarAccessToken(rt.credencial.usuarioRefId, rt.credencial.email);
        String nuevoRefreshToken = persistirRefreshToken(rt.credencial);

        return new RefreshResponseDTO(nuevoAccessToken, nuevoRefreshToken);
    }

    @Transactional
    public void logout(RefreshRequestDTO dto) {
        refreshTokenRepository.findByToken(dto.refreshToken)
                .ifPresent(rt -> rt.invalidado = true);
    }

    public ValidateResponseDTO validate(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return new ValidateResponseDTO(false, null, null);
        }
        String token = authHeader.substring(7);
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            UUID usuarioId = UUID.fromString(claims.getSubject());
            String email = claims.get("email", String.class);
            return new ValidateResponseDTO(true, usuarioId, email);
        } catch (Exception e) {
            return new ValidateResponseDTO(false, null, null);
        }
    }

    private String generarAccessToken(UUID usuarioId, String email) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationHours * 3600 * 1000);
        return Jwts.builder()
                .subject(usuarioId.toString())
                .claim("email", email)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(getSigningKey())
                .compact();
    }

    private String persistirRefreshToken(Credencial credencial) {
        RefreshToken rt = new RefreshToken();
        rt.credencial = credencial;
        rt.token = UUID.randomUUID().toString();
        rt.expiresAt = LocalDateTime.now().plusDays(refreshExpirationDays);
        rt.invalidado = false;
        rt.creadoEn = LocalDateTime.now();
        refreshTokenRepository.persist(rt);
        return rt.token;
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = Base64.getDecoder().decode(jwtSecret);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
