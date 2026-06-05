package com.grupofrontera.msusers.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public class UsuarioRolResponseDTO {
    public UUID id;
    public UUID usuarioId;
    public String nombreUsuario;
    public UUID rolId;
    public String nombreRol;
    public LocalDateTime asignadoEn;
}
