-- ================================================================
-- V3: Catalogo geografico (region/ciudad) centralizado en ms-datos
--     + seed de las 16 regiones de Chile con sus ciudades principales
--     + seed de sucursales con ids deterministas (1..3).
-- ================================================================

-- Tabla region
CREATE TABLE region (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabla ciudad
CREATE TABLE ciudad (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    region_id BIGINT NOT NULL REFERENCES region(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ciudad_region ON ciudad(region_id);

-- Referencia opcional de sucursal -> ciudad (se conserva el texto 'ciudad')
ALTER TABLE sucursal ADD COLUMN ciudad_id BIGINT REFERENCES ciudad(id);

-- ---------------------------------------------------------------
-- Seed: 16 regiones de Chile (orden norte -> sur)
-- ---------------------------------------------------------------
INSERT INTO region (id, nombre) VALUES
    (1,  'Region de Arica y Parinacota'),
    (2,  'Region de Tarapaca'),
    (3,  'Region de Antofagasta'),
    (4,  'Region de Atacama'),
    (5,  'Region de Coquimbo'),
    (6,  'Region de Valparaiso'),
    (7,  'Region Metropolitana de Santiago'),
    (8,  'Region del Libertador General Bernardo O''Higgins'),
    (9,  'Region del Maule'),
    (10, 'Region de Nuble'),
    (11, 'Region del Biobio'),
    (12, 'Region de La Araucania'),
    (13, 'Region de Los Rios'),
    (14, 'Region de Los Lagos'),
    (15, 'Region de Aysen del General Carlos Ibanez del Campo'),
    (16, 'Region de Magallanes y de la Antartica Chilena');
SELECT setval(pg_get_serial_sequence('region', 'id'), (SELECT MAX(id) FROM region));

-- ---------------------------------------------------------------
-- Seed: ciudades por region
-- ---------------------------------------------------------------
INSERT INTO ciudad (id, nombre, region_id) VALUES
    (1,  'Arica',          1),
    (2,  'Putre',          1),
    (3,  'Iquique',        2),
    (4,  'Alto Hospicio',  2),
    (5,  'Pozo Almonte',   2),
    (6,  'Antofagasta',    3),
    (7,  'Calama',         3),
    (8,  'Tocopilla',      3),
    (9,  'Mejillones',     3),
    (10, 'Copiapo',        4),
    (11, 'Vallenar',       4),
    (12, 'Caldera',        4),
    (13, 'La Serena',      5),
    (14, 'Coquimbo',       5),
    (15, 'Ovalle',         5),
    (16, 'Illapel',        5),
    (17, 'Valparaiso',     6),
    (18, 'Vina del Mar',   6),
    (19, 'Quilpue',        6),
    (20, 'Villa Alemana',  6),
    (21, 'San Antonio',    6),
    (22, 'Santiago',       7),
    (23, 'Puente Alto',    7),
    (24, 'Maipu',          7),
    (25, 'La Florida',     7),
    (26, 'Las Condes',     7),
    (27, 'Providencia',    7),
    (28, 'Rancagua',       8),
    (29, 'San Fernando',   8),
    (30, 'Rengo',          8),
    (31, 'Talca',          9),
    (32, 'Curico',         9),
    (33, 'Linares',        9),
    (34, 'Cauquenes',      9),
    (35, 'Chillan',        10),
    (36, 'San Carlos',     10),
    (37, 'Bulnes',         10),
    (38, 'Concepcion',     11),
    (39, 'Talcahuano',     11),
    (40, 'Los Angeles',    11),
    (41, 'Coronel',        11),
    (42, 'Chiguayante',    11),
    (43, 'Temuco',         12),
    (44, 'Padre Las Casas',12),
    (45, 'Villarrica',     12),
    (46, 'Angol',          12),
    (47, 'Valdivia',       13),
    (48, 'La Union',       13),
    (49, 'Rio Bueno',      13),
    (50, 'Puerto Montt',   14),
    (51, 'Osorno',         14),
    (52, 'Castro',         14),
    (53, 'Ancud',          14),
    (54, 'Coyhaique',      15),
    (55, 'Puerto Aysen',   15),
    (56, 'Punta Arenas',   16),
    (57, 'Puerto Natales', 16);
SELECT setval(pg_get_serial_sequence('ciudad', 'id'), (SELECT MAX(id) FROM ciudad));

-- ---------------------------------------------------------------
-- Seed: sucursales (ids 1..3 -> referenciadas por ms-users y ms-kpis)
-- ciudad_id apunta a Santiago(22), Valparaiso(17), Concepcion(38)
-- ---------------------------------------------------------------
INSERT INTO sucursal (id, codigo, nombre, ciudad, habilitada, latitud, longitud, ciudad_id) VALUES
    (1, 'SUC-001', 'Santiago Centro',   'Santiago',   TRUE, -33.4489, -70.6693, 22),
    (2, 'SUC-002', 'Valparaiso Centro', 'Valparaiso', TRUE, -33.0472, -71.6127, 17),
    (3, 'SUC-003', 'Concepcion Centro', 'Concepcion', TRUE, -36.8201, -73.0444, 38);
SELECT setval(pg_get_serial_sequence('sucursal', 'id'), (SELECT MAX(id) FROM sucursal));
