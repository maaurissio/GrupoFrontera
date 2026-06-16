-- ================================================================
-- V6: Reemplaza las 3 sucursales por 4 nuevas (ids 1..4) y regenera
--     5000 datos consolidados con valores NATURALES (no redondeados).
--     Las ciudades referenciadas ya existen en el catálogo (V3):
--       Angol=46 (Araucanía), Coronel=41 (Biobío),
--       Santiago=22 (RM),     Puerto Montt=50 (Los Lagos)
-- ================================================================

-- 1. Limpiar datos dependientes (log referencia dato_consolidado)
TRUNCATE TABLE dato_consolidado, log_trazabilidad RESTART IDENTITY;

-- 2. Reemplazar sucursales
DELETE FROM sucursal;
INSERT INTO sucursal (id, codigo, nombre, ciudad, habilitada, latitud, longitud, ciudad_id) VALUES
    (1, 'SUC-01', 'Don Raucho',     'Angol',        TRUE, -37.81915589100055, -72.67180807056974, 46),
    (2, 'SUC-02', 'Jurel San Jose', 'Coronel',      TRUE, -37.02267600243488, -73.16275139532613, 41),
    (3, 'SUC-03', 'Hogar Central',  'Santiago',     TRUE, -33.44889000000000, -70.66930000000000, 22),
    (4, 'SUC-04', 'TecnoSur',       'Puerto Montt', TRUE, -41.47170000000000, -72.93690000000000, 50);
SELECT setval(pg_get_serial_sequence('sucursal', 'id'), 4);

-- 3. 5000 datos consolidados con valores naturales
WITH base AS (
    SELECT
        i,
        CASE
            WHEN i % 10 IN (0, 1, 2) THEN 'VENTA'
            WHEN i % 10 IN (3, 4, 5) THEN 'INVENTARIO'
            WHEN i % 10 = 6          THEN 'DEVOLUCCION'
            WHEN i % 10 = 7          THEN 'TRANSFERENCIA'
            ELSE                          'AJUSTE_INVENTARIO'
        END AS tipo,
        ((i - 1) % 4) + 1 AS suc_id,
        (DATE '2025-07-01' + (((i - 1) % 12) * INTERVAL '1 month'))::DATE AS periodo_d,
        CASE
            WHEN i % 10 BETWEEN 0 AND 6 THEN 'PROCESADO'
            WHEN i % 10 = 7             THEN 'VALIDADO'
            WHEN i % 10 = 8             THEN 'RECIBIDO'
            ELSE                             'ERROR'
        END AS estado_v
    FROM generate_series(1, 5000) AS i
)
INSERT INTO dato_consolidado (fuente_id, sucursal_id, tipo_dato, periodo, valor, estado)
SELECT
    CASE tipo
        WHEN 'VENTA'             THEN CASE WHEN i % 2 = 0 THEN 1 ELSE 4 END
        WHEN 'INVENTARIO'        THEN 3
        WHEN 'DEVOLUCCION'       THEN 5
        WHEN 'TRANSFERENCIA'     THEN 3
        WHEN 'AJUSTE_INVENTARIO' THEN 2
    END AS fuente_id,

    suc_id    AS sucursal_id,
    tipo      AS tipo_dato,
    periodo_d AS periodo,

    CASE tipo
        WHEN 'VENTA' THEN
            json_build_object(
                'categoria',
                    (ARRAY['Television','Computacion','Telefonia','Electrodomesticos',
                           'Muebles','Audio','Videojuegos','Climatizacion'])[(i % 8) + 1],
                'productos',     2 + (i % 7),
                -- total natural garantizado: base(000) + miles + cola 1..999 (nunca termina en 000)
                'total',         92000 + (((i * 104729) % 408) * 1000) + (((i * 7919) % 999) + 1),
                'transacciones', 5 + ((i * 13) % 95),
                'canal',         CASE WHEN i % 2 = 0 THEN 'TIENDA' ELSE 'ONLINE' END
            )::TEXT

        WHEN 'INVENTARIO' THEN
            json_build_object(
                'sku',           'SKU-' || LPAD(((i % 800) + 1)::TEXT, 5, '0'),
                'descripcion',
                    (ARRAY['Smart TV 55"','Laptop Core i7','Smartphone Pro Max',
                           'Lavadora 10kg','Refrigerador No Frost 400L','Silla Gamer Pro',
                           'Audifonos Bluetooth ANC','Microondas 30L Inverter',
                           'Tablet 10" 128GB','Aspiradora Robot WiFi'])[(i % 10) + 1],
                'stock_actual',  1 + ((i * 7) % 240),
                'stock_minimo',  5 + ((i * 3) % 40),
                'bajo_minimo',   (1 + ((i * 7) % 240)) <= (5 + ((i * 3) % 40)),
                'valor_unitario', 19000 + (((i * 65537) % 470) * 1000) + (((i * 5417) % 999) + 1)
            )::TEXT

        WHEN 'DEVOLUCCION' THEN
            json_build_object(
                'motivo',
                    (ARRAY['Producto defectuoso','No cumple expectativas',
                           'Error en pedido','Dano en transporte',
                           'Compra duplicada','Cambio de opinion'])[(i % 6) + 1],
                'monto',    8000 + (((i * 49157) % 188) * 1000) + (((i * 271) % 999) + 1),
                'unidades', 1 + (i % 4),
                'sku',      'SKU-' || LPAD(((i % 800) + 1)::TEXT, 5, '0')
            )::TEXT

        WHEN 'TRANSFERENCIA' THEN
            json_build_object(
                'sucursal_origen',  suc_id,
                'sucursal_destino', (suc_id % 4) + 1,
                'sku',              'SKU-' || LPAD(((i % 800) + 1)::TEXT, 5, '0'),
                'unidades',         1 + ((i * 11) % 60),
                'motivo',
                    (ARRAY['Rebalanceo de stock','Cierre temporal',
                           'Alta demanda puntual','Sobrestock'])[(i % 4) + 1]
            )::TEXT

        WHEN 'AJUSTE_INVENTARIO' THEN
            json_build_object(
                'tipo',
                    (ARRAY['ENTRADA','SALIDA','MERMA','CONTEO'])[(i % 4) + 1],
                'sku',      'SKU-' || LPAD(((i % 800) + 1)::TEXT, 5, '0'),
                'cantidad', 1 + ((i * 17) % 45),
                'motivo',
                    (ARRAY['Recepcion de mercaderia','Venta directa sin caja',
                           'Producto vencido o danado','Inventario fisico periodico',
                           'Correccion por error de sistema'])[(i % 5) + 1]
            )::TEXT
    END AS valor,

    estado_v AS estado

FROM base;

-- 4. Logs de trazabilidad para datos con estado final (PROCESADO/VALIDADO/ERROR)
INSERT INTO log_trazabilidad (dato_consolidado_id, accion, detalle, created_at)
SELECT
    dc.id,
    CASE dc.estado
        WHEN 'PROCESADO' THEN 'PROCESAMIENTO_EXITOSO'
        WHEN 'VALIDADO'  THEN 'VALIDACION_COMPLETADA'
        WHEN 'ERROR'     THEN 'ERROR_PROCESAMIENTO'
    END,
    CASE dc.estado
        WHEN 'PROCESADO' THEN 'Dato integrado correctamente al repositorio consolidado'
        WHEN 'VALIDADO'  THEN 'Validacion de formato y consistencia de valores completada'
        WHEN 'ERROR'     THEN 'Error al procesar: valor fuera de rango o formato invalido'
    END,
    dc.created_at + INTERVAL '2 minutes'
FROM dato_consolidado dc
WHERE dc.estado IN ('PROCESADO', 'VALIDADO', 'ERROR');
