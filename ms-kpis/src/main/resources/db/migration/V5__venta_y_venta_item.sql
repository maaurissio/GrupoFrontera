CREATE TABLE IF NOT EXISTS venta (
    id              BIGSERIAL     PRIMARY KEY,
    sucursal_ref_id BIGINT        NOT NULL,
    periodo         VARCHAR(7)    NOT NULL,
    fecha_hora      TIMESTAMP     NOT NULL,
    monto_total     NUMERIC(12,2) NOT NULL,
    canal           VARCHAR(30)   NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_venta_sucursal_periodo ON venta (sucursal_ref_id, periodo);
CREATE INDEX IF NOT EXISTS idx_venta_periodo ON venta (periodo);

CREATE TABLE IF NOT EXISTS venta_item (
    id              BIGSERIAL     PRIMARY KEY,
    venta_id        BIGINT        NOT NULL REFERENCES venta(id) ON DELETE CASCADE,
    producto_ref_id BIGINT,
    codigo_producto VARCHAR(50)   NOT NULL,
    nombre_producto VARCHAR(150)  NOT NULL,
    categoria       VARCHAR(30),
    cantidad        INTEGER       NOT NULL,
    precio_unitario NUMERIC(12,2) NOT NULL,
    subtotal        NUMERIC(12,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_venta_item_venta_id ON venta_item (venta_id);
