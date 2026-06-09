CREATE TABLE fuente (
    id BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE sucursal (
    id BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(200) NOT NULL,
    ciudad VARCHAR(150) NOT NULL,
    habilitada BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE dato_consolidado (
    id BIGSERIAL PRIMARY KEY,
    fuente_id BIGINT NOT NULL REFERENCES fuente(id),
    sucursal_id BIGINT NOT NULL REFERENCES sucursal(id),
    tipo_dato VARCHAR(100) NOT NULL,
    periodo DATE NOT NULL,
    valor TEXT,
    estado VARCHAR(20) NOT NULL DEFAULT 'RECIBIDO',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE log_trazabilidad (
    id BIGSERIAL PRIMARY KEY,
    dato_consolidado_id BIGINT NOT NULL REFERENCES dato_consolidado(id),
    accion VARCHAR(50) NOT NULL,
    detalle TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dato_estado ON dato_consolidado(estado);
CREATE INDEX idx_dato_sucursal ON dato_consolidado(sucursal_id);
CREATE INDEX idx_dato_tipo_periodo ON dato_consolidado(tipo_dato, periodo);
CREATE INDEX idx_dato_fuente ON dato_consolidado(fuente_id);
CREATE INDEX idx_log_dato ON log_trazabilidad(dato_consolidado_id);
CREATE INDEX idx_fuente_activa ON fuente(activa);
CREATE INDEX idx_sucursal_habilitada ON sucursal(habilitada);
