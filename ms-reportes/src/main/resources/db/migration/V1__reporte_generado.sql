-- Historial de reportes generados (export real desde /reportes/exportar y /reportes/inventario).
-- Sin blobs: solo se guardan los parametros usados, para poder re-generar el archivo al descargar.
CREATE TABLE reporte_generado (
    id                BIGSERIAL PRIMARY KEY,
    tipo              VARCHAR(20)  NOT NULL,  -- KPIS | INVENTARIO
    formato           VARCHAR(10)  NOT NULL,  -- PDF | XLSX
    periodo           VARCHAR(7),             -- YYYY-MM; NULL para INVENTARIO
    sucursal_id       BIGINT,                 -- NULL = consolidado (todas las sucursales)
    sucursal_nombre   VARCHAR(200),           -- snapshot del nombre al momento de generar
    favorito          BOOLEAN      NOT NULL DEFAULT FALSE,
    fecha_generacion  TIMESTAMP    NOT NULL DEFAULT now()
);

CREATE INDEX idx_reporte_generado_fecha ON reporte_generado (fecha_generacion DESC);
