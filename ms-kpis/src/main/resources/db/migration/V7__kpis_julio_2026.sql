-- ================================================================
-- V7: Agrega el periodo 2026-07 (mes actual) para las 4 sucursales,
--     continuando la serie determinista de V4 (idx=12, mes=7,
--     mismo factor estacional + jitter y mismas metas).
-- ================================================================

INSERT INTO indicador_ventas
    (sucursal_ref_id, periodo, total_ventas, cantidad_transacciones,
     ticket_promedio, meta_mensual, porcentaje_cumplimiento, fecha_calculo)
SELECT
    s.sid,
    '2026-07',
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
CROSS JOIN LATERAL (
    SELECT
        GREATEST(
            ROUND(
                s.meta * 0.86 -- factor estacional de julio (igual a V4)
                + (((s.sid * 7919 + 12 * 104729) % 90000) - 45000),
                2),
            1000000
        )::numeric(15,2) AS total,
        (210 + ((s.sid * 53 + 12 * 131) % 170) + s.sid * 35)::int AS tx
) AS v
ON CONFLICT (sucursal_ref_id, periodo) DO NOTHING;

INSERT INTO indicador_inventario
    (sucursal_ref_id, periodo, productos_bajo_minimo,
     rotacion_promedio, dias_sin_reposicion, fecha_calculo)
SELECT
    s.sid,
    '2026-07',
    (3 + ((s.sid * 17 + 12 * 29) % 13))::int,
    ROUND((3.8 + ((s.sid * 13 + 12 * 37) % 33) / 10.0)::numeric, 2),
    (1 + ((s.sid * 7 + 12 * 19) % 6))::int,
    NOW()
FROM (VALUES (1), (2), (3), (4)) AS s(sid)
ON CONFLICT (sucursal_ref_id, periodo) DO NOTHING;
