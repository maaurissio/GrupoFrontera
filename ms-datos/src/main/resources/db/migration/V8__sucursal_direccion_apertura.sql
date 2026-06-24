-- ================================================================
-- V8: Agrega direccion y anio_apertura a sucursal (campos opcionales,
--     editables desde el modal de sucursal del front). Sin seed: las
--     4 sucursales existentes quedan en NULL hasta que se editen con
--     datos reales.
-- ================================================================

ALTER TABLE sucursal ADD COLUMN direccion VARCHAR(250);
ALTER TABLE sucursal ADD COLUMN anio_apertura INT;
