-- ================================================================
-- V4: Seed de datos de prueba para retail hogar y tecnología
--     5 fuentes · 1000 datos consolidados · 3 sucursales · 12 meses
--     Distribucion: VENTA 30% · INVENTARIO 30% · DEVOLUCCION 10%
--                   TRANSFERENCIA 10% · AJUSTE_INVENTARIO 20%
-- ================================================================

-- Fuentes de datos corporativas
INSERT INTO fuente (id, codigo, nombre, descripcion, activa) VALUES
    (1, 'POS-001',  'Sistema POS',           'Punto de venta en tienda — transacciones de caja en sucursal',       TRUE),
    (2, 'ERP-001',  'ERP Corporativo',        'Planificacion empresarial — modulo finanzas, compras y ajustes',     TRUE),
    (3, 'WMS-001',  'Sistema WMS',            'Gestion de almacen — movimientos de stock y transferencias',         TRUE),
    (4, 'ECOM-001', 'Plataforma E-Commerce',  'Tienda online — ventas digitales y despacho a domicilio',            TRUE),
    (5, 'CRM-001',  'CRM Corporativo',        'Gestion de devoluciones, reclamos y atencion post-venta',            TRUE);
SELECT setval(pg_get_serial_sequence('fuente', 'id'), 5);

-- 1000 datos consolidados generados con aritmética determinista
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
        ((i - 1) % 3) + 1 AS suc_id,
        (DATE '2025-07-01' + (((i - 1) % 12) * INTERVAL '1 month'))::DATE AS periodo_d,
        CASE
            WHEN i % 10 BETWEEN 0 AND 6 THEN 'PROCESADO'
            WHEN i % 10 = 7             THEN 'VALIDADO'
            WHEN i % 10 = 8             THEN 'RECIBIDO'
            ELSE                             'ERROR'
        END AS estado_v
    FROM generate_series(1, 1000) AS i
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
                'productos',    (i % 8) + 2,
                'total',        (i % 200) * 45000 + 120000,
                'transacciones',(i % 30)  + 5,
                'canal',        CASE WHEN i % 2 = 0 THEN 'TIENDA' ELSE 'ONLINE' END
            )::TEXT

        WHEN 'INVENTARIO' THEN
            json_build_object(
                'sku',
                    'SKU-' || LPAD(((i % 500) + 1)::TEXT, 5, '0'),
                'descripcion',
                    (ARRAY['Smart TV 55"','Laptop Core i7','Smartphone Pro Max',
                           'Lavadora 10kg','Refrigerador No Frost 400L','Silla Gamer Pro',
                           'Audifonos Bluetooth ANC','Microondas 30L Inverter',
                           'Tablet 10" 128GB','Aspiradora Robot WiFi'])[(i % 10) + 1],
                'stock_actual',   (i % 150) + 1,
                'stock_minimo',   (i % 20)  + 5,
                'bajo_minimo',    ((i % 150) + 1 <= (i % 20) + 5),
                'valor_unitario', (i % 30)  * 15000 + 25000
            )::TEXT

        WHEN 'DEVOLUCCION' THEN
            json_build_object(
                'motivo',
                    (ARRAY['Producto defectuoso','No cumple expectativas',
                           'Error en pedido','Dano en transporte',
                           'Compra duplicada','Cambio de opinion'])[(i % 6) + 1],
                'monto',    (i % 50)  * 8000 + 15000,
                'unidades', (i % 3)   + 1,
                'sku',      'SKU-' || LPAD(((i % 500) + 1)::TEXT, 5, '0')
            )::TEXT

        WHEN 'TRANSFERENCIA' THEN
            json_build_object(
                'sucursal_origen',  suc_id,
                'sucursal_destino', (suc_id % 3) + 1,
                'sku',              'SKU-' || LPAD(((i % 500) + 1)::TEXT, 5, '0'),
                'unidades',         (i % 20) + 1,
                'motivo',
                    (ARRAY['Rebalanceo de stock','Cierre temporal',
                           'Alta demanda puntual','Sobrestock'])[(i % 4) + 1]
            )::TEXT

        WHEN 'AJUSTE_INVENTARIO' THEN
            json_build_object(
                'tipo',
                    (ARRAY['ENTRADA','SALIDA','MERMA','CONTEO'])[(i % 4) + 1],
                'sku',      'SKU-' || LPAD(((i % 500) + 1)::TEXT, 5, '0'),
                'cantidad', (i % 25) + 1,
                'motivo',
                    (ARRAY['Recepcion de mercaderia','Venta directa sin caja',
                           'Producto vencido o danado','Inventario fisico periodico',
                           'Correccion por error de sistema'])[(i % 5) + 1]
            )::TEXT
    END AS valor,

    estado_v AS estado

FROM base;

-- Logs de trazabilidad para datos con estado PROCESADO, VALIDADO o ERROR
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
