-- ================================================================
-- V7: Elimina el dominio viejo "datos consolidados" (5000 datos +
--     log de trazabilidad) y crea el nuevo dominio "Producto".
--     Sucursales de referencia (V6, ids 1..4):
--       1 Don Raucho (Angol), 2 Jurel San Jose (Coronel),
--       3 Hogar Central (Santiago), 4 TecnoSur (Puerto Montt)
-- ================================================================

-- 1. Eliminar dominio viejo (log referencia dato_consolidado -> primero el log)
DROP TABLE IF EXISTS log_trazabilidad;
DROP TABLE IF EXISTS dato_consolidado;

-- 2. Crear tabla producto
CREATE TABLE producto (
    id                        BIGSERIAL PRIMARY KEY,
    codigo                    VARCHAR(100) NOT NULL,
    nombre                    VARCHAR(200) NOT NULL,
    sucursal_id               BIGINT       NOT NULL REFERENCES sucursal(id),
    categoria                 VARCHAR(40)  NOT NULL,
    stock                     INT          NOT NULL DEFAULT 0,
    stock_minimo              INT          NOT NULL DEFAULT 0,
    precio                    NUMERIC(12,2) NOT NULL DEFAULT 0,
    descripcion               TEXT,
    activo                    BOOLEAN      NOT NULL DEFAULT TRUE,
    fecha_actualizacion_stock TIMESTAMP,
    created_at                TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at                TIMESTAMP,
    CONSTRAINT uq_producto_codigo_sucursal UNIQUE (codigo, sucursal_id)
);

CREATE INDEX idx_producto_sucursal  ON producto (sucursal_id);
CREATE INDEX idx_producto_categoria ON producto (categoria);
CREATE INDEX idx_producto_activo    ON producto (activo);

-- 3. Seed: ~48 productos (12 por sucursal, repartidos entre las 8 categorias)
--    Precios NATURALES (no terminan en 000). Stock variado; algunos bajo el minimo.
--    Codigo unico por sucursal: P-<nnn>-S<suc>.
INSERT INTO producto (codigo, nombre, sucursal_id, categoria, stock, stock_minimo, precio, descripcion, activo, fecha_actualizacion_stock) VALUES
-- ---------- Sucursal 1: Don Raucho (Angol) ----------
('P-001-S1', 'Refrigerador No Frost 320L',      1, 'ELECTRODOMESTICO', 18,  6,  349990, 'Refrigerador eficiencia A+ con dispensador de agua', TRUE, now()),
('P-002-S1', 'Lavadora Carga Frontal 9kg',      1, 'ELECTRODOMESTICO', 12,  5,  279490, 'Lavadora inverter silenciosa 1400 RPM',             TRUE, now()),
('P-003-S1', 'Smart TV LED 50" 4K',             1, 'TV',               3,   8,  329750, 'Televisor 4K UHD con HDR10 y Google TV',            TRUE, now()),
('P-004-S1', 'Smart TV LED 32" HD',             1, 'TV',               22,  6,  149990, 'Televisor HD con apps integradas',                  TRUE, now()),
('P-005-S1', 'Smartphone 6.5" 128GB',           1, 'MOVIL',            27,  10, 219490, 'Smartphone pantalla AMOLED triple camara',          TRUE, now()),
('P-006-S1', 'Smartphone Gama Media 64GB',      1, 'MOVIL',            4,   12, 139950, 'Smartphone bateria 5000mAh carga rapida',           TRUE, now()),
('P-007-S1', 'Consola Portatil 64GB',           1, 'CONSOLA',          9,   4,  329990, 'Consola hibrida con dock incluido',                 TRUE, now()),
('P-008-S1', 'Notebook 15.6" Core i5 16GB',     1, 'COMPUTACION',      7,   5,  549750, 'Notebook SSD 512GB pantalla Full HD',               TRUE, now()),
('P-009-S1', 'Barra de Sonido 2.1',             1, 'AUDIO',            14,  6,  119490, 'Barra de sonido con subwoofer inalambrico',         TRUE, now()),
('P-010-S1', 'Audifonos Bluetooth ANC',         1, 'AUDIO',            31,  10, 89990,  'Audifonos over-ear cancelacion de ruido',           TRUE, now()),
('P-011-S1', 'Cable HDMI 2.1 2m',               1, 'ACCESORIO',        58,  20, 12990,  'Cable HDMI 8K alta velocidad',                      TRUE, now()),
('P-012-S1', 'Set Limpieza Pantallas',          1, 'OTRO',            40,  15, 7490,   'Kit de limpieza para pantallas y electronica',      TRUE, now()),
-- ---------- Sucursal 2: Jurel San Jose (Coronel) ----------
('P-001-S2', 'Microondas 28L Inverter',         2, 'ELECTRODOMESTICO', 16,  6,  119990, 'Microondas con grill y descongelado inteligente',   TRUE, now()),
('P-002-S2', 'Aspiradora Robot WiFi',           2, 'ELECTRODOMESTICO', 5,   8,  189990, 'Robot aspirador con mapeo laser y app',             TRUE, now()),
('P-003-S2', 'Smart TV QLED 55" 4K',            2, 'TV',               11,  5,  529490, 'Televisor QLED Quantum Dot 120Hz',                  TRUE, now()),
('P-004-S2', 'Smart TV LED 43" 4K',             2, 'TV',               19,  6,  259750, 'Televisor 4K con Dolby Vision',                     TRUE, now()),
('P-005-S2', 'Smartphone Pro 256GB',            2, 'MOVIL',            13,  8,  599990, 'Smartphone tope de gama camara 108MP',              TRUE, now()),
('P-006-S2', 'Smartphone 5G 128GB',             2, 'MOVIL',            2,   10, 329490, 'Smartphone 5G pantalla 120Hz',                      TRUE, now()),
('P-007-S2', 'Consola Sobremesa 1TB',           2, 'CONSOLA',          6,   4,  649950, 'Consola next-gen con lector de discos',             TRUE, now()),
('P-008-S2', 'Control Inalambrico Pro',         2, 'CONSOLA',          28,  12, 79490,  'Control inalambrico con gatillos adaptativos',      TRUE, now()),
('P-009-S2', 'Notebook 14" Core i7 16GB',       2, 'COMPUTACION',      8,   5,  729990, 'Ultrabook liviano SSD 1TB',                         TRUE, now()),
('P-010-S2', 'Monitor Gamer 27" 165Hz',         2, 'COMPUTACION',      4,   6,  239750, 'Monitor QHD 1ms panel IPS',                         TRUE, now()),
('P-011-S2', 'Parlante Bluetooth Portatil',     2, 'AUDIO',            33,  10, 49990,  'Parlante resistente al agua IPX7',                  TRUE, now()),
('P-012-S2', 'Mouse Inalambrico Ergonomico',    2, 'ACCESORIO',        47,  15, 24490,  'Mouse silencioso 6 botones',                        TRUE, now()),
-- ---------- Sucursal 3: Hogar Central (Santiago) ----------
('P-001-S3', 'Refrigerador Side by Side 540L',  3, 'ELECTRODOMESTICO', 9,   4,  899990, 'Refrigerador con dispensador e Inverter',           TRUE, now()),
('P-002-S3', 'Lavavajillas 14 Cubiertos',       3, 'ELECTRODOMESTICO', 7,   5,  459490, 'Lavavajillas eficiencia A++ silencioso',            TRUE, now()),
('P-003-S3', 'Smart TV OLED 65" 4K',            3, 'TV',               3,   5,  1299750, 'Televisor OLED evo 120Hz Gaming',                  TRUE, now()),
('P-004-S3', 'Smart TV LED 75" 4K',             3, 'TV',               6,   4,  799990, 'Televisor 75 pulgadas 4K HDR',                      TRUE, now()),
('P-005-S3', 'Smartphone Ultra 512GB',          3, 'MOVIL',            15,  8,  1099490, 'Smartphone flagship con S-Pen',                     TRUE, now()),
('P-006-S3', 'Smartphone Compacto 128GB',       3, 'MOVIL',            21,  10, 449950, 'Smartphone compacto alto rendimiento',              TRUE, now()),
('P-007-S3', 'Consola Sobremesa Digital',       3, 'CONSOLA',          12,  4,  549990, 'Consola edicion digital sin lector',                TRUE, now()),
('P-008-S3', 'PC Gamer RTX Ryzen 7',            3, 'COMPUTACION',      2,   3,  1349750, 'Torre gamer 32GB SSD 1TB RTX',                     TRUE, now()),
('P-009-S3', 'Notebook 16" Core i9 32GB',       3, 'COMPUTACION',      5,   4,  1199990, 'Notebook creador SSD 2TB pantalla OLED',            TRUE, now()),
('P-010-S3', 'Soundbar Dolby Atmos 5.1.2',      3, 'AUDIO',            10,  5,  389490, 'Barra de sonido con parlantes traseros',            TRUE, now()),
('P-011-S3', 'Teclado Mecanico RGB',            3, 'ACCESORIO',        36,  12, 64990,  'Teclado mecanico switches rojos hot-swap',          TRUE, now()),
('P-012-S3', 'Bateria Externa 20000mAh',        3, 'ACCESORIO',        54,  20, 29750,  'Power bank carga rapida 65W',                       TRUE, now()),
-- ---------- Sucursal 4: TecnoSur (Puerto Montt) ----------
('P-001-S4', 'Estufa Electrica Ceramica',       4, 'ELECTRODOMESTICO', 14,  6,  89990,  'Estufa de bajo consumo con termostato',             TRUE, now()),
('P-002-S4', 'Cafetera Espresso Automatica',    4, 'ELECTRODOMESTICO', 3,   5,  269490, 'Cafetera con molinillo integrado',                  TRUE, now()),
('P-003-S4', 'Smart TV LED 55" 4K',             4, 'TV',               17,  6,  379750, 'Televisor 4K con asistente de voz',                 TRUE, now()),
('P-004-S4', 'Smart TV LED 40" FHD',            4, 'TV',               25,  8,  179990, 'Televisor Full HD con apps',                        TRUE, now()),
('P-005-S4', 'Smartphone 5G 256GB',             4, 'MOVIL',            18,  10, 489490, 'Smartphone 5G camara 50MP OIS',                     TRUE, now()),
('P-006-S4', 'Smartphone Basico 32GB',          4, 'MOVIL',            6,   12, 99490,  'Smartphone economico bateria de larga duracion',    TRUE, now()),
('P-007-S4', 'Consola Retro HDMI',              4, 'CONSOLA',          20,  8,  59950,  'Consola retro con 500 juegos clasicos',             TRUE, now()),
('P-008-S4', 'Notebook 15.6" Ryzen 5 8GB',      4, 'COMPUTACION',      11,  5,  429750, 'Notebook SSD 512GB uso diario',                     TRUE, now()),
('P-009-S4', 'Tablet 11" 128GB',                4, 'COMPUTACION',      4,   6,  299490, 'Tablet con lapiz incluido pantalla 90Hz',           TRUE, now()),
('P-010-S4', 'Audifonos True Wireless',         4, 'AUDIO',            29,  12, 69990,  'Audifonos in-ear ANC con estuche de carga',         TRUE, now()),
('P-011-S4', 'Cargador GaN 100W',               4, 'ACCESORIO',        43,  15, 34490,  'Cargador GaN 3 puertos carga ultra rapida',         TRUE, now()),
('P-012-S4', 'Mochila Tecnologica Antirrobo',   4, 'OTRO',            8,   10, 39750,  'Mochila con puerto USB y compartimento notebook',   TRUE, now());
