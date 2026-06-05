CREATE TABLE IF NOT EXISTS indicador_ventas (
    id                      BIGSERIAL     PRIMARY KEY,
    sucursal_ref_id         BIGINT        NOT NULL,
    periodo                 VARCHAR(7)    NOT NULL,
    total_ventas            NUMERIC(15,2) NOT NULL DEFAULT 0,
    cantidad_transacciones  INTEGER       NOT NULL DEFAULT 0,
    ticket_promedio         NUMERIC(12,2) NOT NULL DEFAULT 0,
    meta_mensual            NUMERIC(15,2) NOT NULL DEFAULT 0,
    porcentaje_cumplimiento NUMERIC(5,2)  NOT NULL DEFAULT 0,
    fecha_calculo           TIMESTAMP     NOT NULL,
    UNIQUE (sucursal_ref_id, periodo)
);

CREATE TABLE IF NOT EXISTS indicador_inventario (
    id                    BIGSERIAL    PRIMARY KEY,
    sucursal_ref_id       BIGINT       NOT NULL,
    periodo               VARCHAR(7)   NOT NULL,
    productos_bajo_minimo INTEGER      NOT NULL DEFAULT 0,
    rotacion_promedio     NUMERIC(8,2) NOT NULL DEFAULT 0,
    dias_sin_reposicion   INTEGER      NOT NULL DEFAULT 0,
    fecha_calculo         TIMESTAMP    NOT NULL,
    UNIQUE (sucursal_ref_id, periodo)
);
