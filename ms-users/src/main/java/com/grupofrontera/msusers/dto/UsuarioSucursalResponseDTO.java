package com.grupofrontera.msusers.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public class UsuarioSucursalResponseDTO {
    public UUID id;
    public UUID usuarioId;
    public String nombreUsuario;
    // Id de la sucursal en ms-datos. El nombre lo resuelve el BFF.
    public Long sucursalId;
    public LocalDateTime asignadoEn;
}
