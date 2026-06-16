-- ================================================================
-- V5: Naturaliza los montos dentro del JSON de dato_consolidado.
--     Los seeds de V4 generaban montos terminados en 000 (poco
--     naturales). Aquí se reemplazan los ÚLTIMOS 3 DÍGITOS por un
--     valor pseudo-aleatorio determinista (1..999, nunca 000),
--     basado en el id de la fila para que sea reproducible.
-- ================================================================

-- VENTA → campo 'total'
UPDATE dato_consolidado
SET valor = jsonb_set(
        valor::jsonb,
        '{total}',
        to_jsonb(
            ((valor::jsonb->>'total')::bigint / 1000) * 1000
            + (((id * 7919) % 999) + 1)
        )
    )::text
WHERE tipo_dato = 'VENTA';

-- DEVOLUCCION → campo 'monto'
UPDATE dato_consolidado
SET valor = jsonb_set(
        valor::jsonb,
        '{monto}',
        to_jsonb(
            ((valor::jsonb->>'monto')::bigint / 1000) * 1000
            + (((id * 6131) % 999) + 1)
        )
    )::text
WHERE tipo_dato = 'DEVOLUCCION';

-- INVENTARIO → campo 'valor_unitario'
UPDATE dato_consolidado
SET valor = jsonb_set(
        valor::jsonb,
        '{valor_unitario}',
        to_jsonb(
            ((valor::jsonb->>'valor_unitario')::bigint / 1000) * 1000
            + (((id * 5417) % 999) + 1)
        )
    )::text
WHERE tipo_dato = 'INVENTARIO';
