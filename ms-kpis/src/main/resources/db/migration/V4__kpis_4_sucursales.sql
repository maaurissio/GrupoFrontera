-- ================================================================
-- V4: Regenera los KPIs para las 4 nuevas sucursales (ids 1..4),
--     12 meses (2025-07 .. 2026-06), con valores NATURALES generados
--     por SQL (factor estacional + jitter determinista por sucursal/mes).
--     Metas por sucursal:
--       1 Don Raucho (Angol)        ->  9.200.000
--       2 Jurel San Jose (Coronel)  -> 10.800.000
--       3 Hogar Central (Santiago)  -> 18.500.000
--       4 TecnoSur (Puerto Montt)   -> 12.300.000
-- ================================================================

TRUNCATE TABLE indicador_ventas RESTART IDENTITY;
TRUNCATE TABLE indicador_inventario RESTART IDENTITY;

-- ---------------------------------------------------------------
-- indicador_ventas
-- ---------------------------------------------------------------
INSERT INTO indicador_ventas
    (sucursal_ref_id, periodo, total_ventas, cantidad_transacciones,
     ticket_promedio, meta_mensual, porcentaje_cumplimiento, fecha_calculo)
SELECT
    s.sid,
    m.periodo,
    v.total,
    v.tx,
    ROUND(v.total / v.tx, 2),
    s.meta,
    ROUND(v.total * 100.0 / s.meta, 2),
    NOW()
FROM (VALUES
        (1,  9200000::numeric),
        (2, 10800000::numeric),
        (3, 18500000::numeric),
        (4, 12300000::numeric)
     ) AS s(sid, meta)
CROSS JOIN (
    SELECT g AS idx,
           to_char(DATE '2025-07-01' + (g * INTERVAL '1 month'), 'YYYY-MM') AS periodo,
           EXTRACT(MONTH FROM DATE '2025-07-01' + (g * INTERVAL '1 month'))::int AS mes
    FROM generate_series(0, 11) AS g
) AS m
CROSS JOIN LATERAL (
    SELECT
        GREATEST(
            ROUND(
                s.meta * (CASE m.mes
                    WHEN 12 THEN 1.46 WHEN 11 THEN 1.12 WHEN 1 THEN 0.97 WHEN 2 THEN 0.82
                    WHEN 3 THEN 0.90 WHEN 4 THEN 0.83 WHEN 5 THEN 0.88 WHEN 6 THEN 0.85
                    WHEN 7 THEN 0.86 WHEN 8 THEN 0.84 WHEN 9 THEN 0.91 WHEN 10 THEN 0.96
                    ELSE 0.88 END)
                + (((s.sid * 7919 + m.idx * 104729) % 90000) - 45000),
            2),
            1000000
        )::numeric(15,2) AS total,
        (210 + ((s.sid * 53 + m.idx * 131) % 170) + s.sid * 35)::int AS tx
) AS v;

-- ---------------------------------------------------------------
-- indicador_inventario
-- ---------------------------------------------------------------
INSERT INTO indicador_inventario
    (sucursal_ref_id, periodo, productos_bajo_minimo,
     rotacion_promedio, dias_sin_reposicion, fecha_calculo)
SELECT
    s.sid,
    m.periodo,
    (3 + ((s.sid * 17 + m.idx * 29) % 13) + CASE WHEN m.mes IN (11, 12) THEN 6 ELSE 0 END)::int,
    ROUND((3.8 + ((s.sid * 13 + m.idx * 37) % 33) / 10.0
                + CASE WHEN m.mes IN (11, 12) THEN 1.4 ELSE 0 END)::numeric, 2),
    (1 + ((s.sid * 7 + m.idx * 19) % 6))::int,
    NOW()
FROM (VALUES (1), (2), (3), (4)) AS s(sid)
CROSS JOIN (
    SELECT g AS idx,
           to_char(DATE '2025-07-01' + (g * INTERVAL '1 month'), 'YYYY-MM') AS periodo,
           EXTRACT(MONTH FROM DATE '2025-07-01' + (g * INTERVAL '1 month'))::int AS mes
    FROM generate_series(0, 11) AS g
) AS m;
