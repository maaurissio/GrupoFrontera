-- ================================================================
-- V6: Genera boletas individuales (venta + venta_item) sinteticas
--     para cada combinacion sucursal+periodo ya sembrada en
--     indicador_ventas, de modo que:
--       - la cantidad de filas 'venta' generadas para cada combo
--         sea exactamente indicador_ventas.cantidad_transacciones
--       - la suma de venta.monto_total para ese combo sea
--         exactamente indicador_ventas.total_ventas
--       - la suma de venta_item.subtotal de cada venta sea
--         exactamente el monto_total de esa venta
-- ================================================================

-- Catalogo de productos representativo (categorias alineadas a
-- CategoriaProducto de ms-datos), usado solo para snapshotear
-- nombre/categoria/precio de referencia en cada linea de boleta.
CREATE TEMP TABLE catalogo_producto (
    codigo   VARCHAR(20),
    nombre   VARCHAR(150),
    categoria VARCHAR(30),
    precio   NUMERIC(12,2)
);

INSERT INTO catalogo_producto (codigo, nombre, categoria, precio) VALUES
    ('REF-001', 'Refrigerador No Frost 400L',      'ELECTRODOMESTICO', 549990),
    ('LAV-002', 'Lavadora Carga Frontal 9kg',       'ELECTRODOMESTICO', 399990),
    ('MIC-003', 'Microondas 20L',                   'ELECTRODOMESTICO',  79990),
    ('TV-004',  'Smart TV 50" 4K',                  'TV',               349990),
    ('TV-005',  'Smart TV 65" 4K',                  'TV',               599990),
    ('TV-006',  'Smart TV 32" HD',                  'TV',               149990),
    ('CEL-007', 'Smartphone Galaxy A54',            'MOVIL',            279990),
    ('CEL-008', 'iPhone 13',                        'MOVIL',            599990),
    ('CEL-009', 'Smartphone Redmi Note 12',         'MOVIL',            159990),
    ('CON-010', 'PlayStation 5',                    'CONSOLA',          549990),
    ('CON-011', 'Xbox Series S',                    'CONSOLA',          329990),
    ('CON-012', 'Nintendo Switch OLED',             'CONSOLA',          359990),
    ('NB-013',  'Notebook Core i5 8GB',              'COMPUTACION',      449990),
    ('NB-014',  'Notebook Core i3 8GB',              'COMPUTACION',      329990),
    ('MON-015', 'Monitor 24" Full HD',               'COMPUTACION',      129990),
    ('AUD-016', 'Audifonos Bluetooth',                'AUDIO',            39990),
    ('PAR-017', 'Parlante Portatil',                  'AUDIO',            49990),
    ('BAR-018', 'Barra de Sonido',                    'AUDIO',           129990),
    ('FUN-019', 'Funda Protectora Celular',           'ACCESORIO',         9990),
    ('CAR-020', 'Cargador Rapido USB-C',              'ACCESORIO',        14990);

-- Reparte un monto total en n partes positivas cuya suma es EXACTA
-- al total original (la ultima parte absorbe el residuo de redondeo).
CREATE OR REPLACE FUNCTION pg_temp.repartir_monto(p_total NUMERIC, p_n INT)
RETURNS NUMERIC[] AS $$
DECLARE
    pesos      NUMERIC[];
    suma_pesos NUMERIC;
    resultado  NUMERIC[] := ARRAY[]::NUMERIC[];
    acumulado  NUMERIC := 0;
    i          INT;
    monto_i    NUMERIC(14,2);
BEGIN
    IF p_n <= 1 THEN
        RETURN ARRAY[p_total::NUMERIC(14,2)];
    END IF;

    -- pesos acotados (0.5 .. 1.5) para evitar montos casi-cero
    pesos := ARRAY(SELECT 0.5 + random() FROM generate_series(1, p_n));
    SELECT SUM(x) INTO suma_pesos FROM UNNEST(pesos) AS x;

    FOR i IN 1..p_n LOOP
        IF i < p_n THEN
            monto_i := ROUND(p_total * pesos[i] / suma_pesos, 2);
        ELSE
            monto_i := p_total - acumulado;
        END IF;
        acumulado := acumulado + monto_i;
        resultado := array_append(resultado, monto_i);
    END LOOP;

    RETURN resultado;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    r            RECORD;
    montos       NUMERIC[];
    n            INT;
    i            INT;
    j            INT;
    v_id         BIGINT;
    ultimo_dia   INT;
    dia          INT;
    hora         INT;
    minuto       INT;
    fecha_v      TIMESTAMP;
    canal_v      VARCHAR(30);
    monto_venta  NUMERIC(12,2);
    num_items    INT;
    item_montos  NUMERIC[];
    prod         RECORD;
    cantidad_i   INT;
    precio_i     NUMERIC(12,2);
    subtotal_i   NUMERIC(12,2);
    suma_items   NUMERIC(12,2);
BEGIN
    FOR r IN SELECT sucursal_ref_id, periodo, total_ventas, cantidad_transacciones
             FROM indicador_ventas
    LOOP
        n := r.cantidad_transacciones;
        IF n IS NULL OR n <= 0 THEN
            CONTINUE;
        END IF;

        montos := pg_temp.repartir_monto(r.total_ventas, n);
        ultimo_dia := EXTRACT(DAY FROM (
            date_trunc('month', to_date(r.periodo || '-01', 'YYYY-MM-DD'))
            + INTERVAL '1 month' - INTERVAL '1 day'
        ))::int;

        FOR i IN 1..n LOOP
            monto_venta := montos[i];

            dia    := 1 + floor(random() * LEAST(28, ultimo_dia))::int;
            hora   := 9 + floor(random() * 12)::int;
            minuto := floor(random() * 60)::int;
            fecha_v := to_date(r.periodo || '-01', 'YYYY-MM-DD')
                       + (dia - 1) * INTERVAL '1 day'
                       + hora * INTERVAL '1 hour'
                       + minuto * INTERVAL '1 minute';
            canal_v := CASE WHEN random() < 0.8 THEN 'TIENDA' ELSE 'ONLINE' END;

            INSERT INTO venta (sucursal_ref_id, periodo, fecha_hora, monto_total, canal)
            VALUES (r.sucursal_ref_id, r.periodo, fecha_v, monto_venta, canal_v)
            RETURNING id INTO v_id;

            num_items := CASE
                WHEN monto_venta < 20000  THEN 1
                WHEN monto_venta < 60000  THEN 1 + floor(random() * 2)::int
                WHEN monto_venta < 150000 THEN 2 + floor(random() * 2)::int
                ELSE 2 + floor(random() * 3)::int
            END;

            item_montos := pg_temp.repartir_monto(monto_venta, num_items);
            suma_items := 0;

            FOR j IN 1..num_items LOOP
                SELECT * INTO prod FROM catalogo_producto ORDER BY random() LIMIT 1;

                IF j < num_items THEN
                    subtotal_i := item_montos[j];
                    cantidad_i := GREATEST(1, ROUND(subtotal_i / prod.precio)::int);
                    precio_i   := ROUND(subtotal_i / cantidad_i, 2);
                    subtotal_i := ROUND(precio_i * cantidad_i, 2);
                ELSE
                    subtotal_i := monto_venta - suma_items;
                    cantidad_i := 1;
                    precio_i   := subtotal_i;
                END IF;

                suma_items := suma_items + subtotal_i;

                INSERT INTO venta_item
                    (venta_id, producto_ref_id, codigo_producto, nombre_producto,
                     categoria, cantidad, precio_unitario, subtotal)
                VALUES
                    (v_id, NULL, prod.codigo, prod.nombre, prod.categoria,
                     cantidad_i, precio_i, subtotal_i);
            END LOOP;
        END LOOP;
    END LOOP;
END $$;

DROP FUNCTION IF EXISTS pg_temp.repartir_monto(NUMERIC, INT);
DROP TABLE IF EXISTS catalogo_producto;
