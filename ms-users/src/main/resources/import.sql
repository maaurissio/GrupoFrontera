-- Roles
INSERT INTO roles (id, nombre, descripcion, permisos, activo, creadoEn, actualizadoEn) VALUES
('a1111111-1111-1111-1111-111111111111', 'ADMIN',   'Administrador del sistema', '{"dashboard":"total","reportes":"total","productos":"total","usuarios":"total","roles":"total","sucursales":"total"}', true, NOW(), NOW()),
('b2222222-2222-2222-2222-222222222222', 'SOPORTE', 'Soporte tecnico',            '{"dashboard":"edicion","reportes":"edicion","productos":"edicion","usuarios":"sin-acceso","roles":"sin-acceso","sucursales":"edicion"}', true, NOW(), NOW()),
('c3333333-3333-3333-3333-333333333333', 'GERENTE', 'Gerente de sucursal',        '{"dashboard":"edicion","reportes":"lectura","productos":"lectura","usuarios":"sin-acceso","roles":"sin-acceso","sucursales":"lectura"}', true, NOW(), NOW());

-- Usuarios
INSERT INTO usuarios (id, rut, dv, nombre, apellido, email, telefono, estado, creadoEn, actualizadoEn) VALUES
('d1111111-1111-1111-1111-111111111111', '21588043', '5', 'Mauricio', 'Gajardo',  'admin@cordillera.cl',   '+56911111111', 'ACTIVO', NOW(), NOW()),
('e2222222-2222-2222-2222-222222222222', '20831765', '2', 'Vicente',  'Munoz',    'soporte@cordillera.cl', '+56922222222', 'ACTIVO', NOW(), NOW()),
('f3333333-3333-3333-3333-333333333333', '21501742', '7', 'Vicente',  'Colicheo', 'gerente@cordillera.cl', '+56933333333', 'ACTIVO', NOW(), NOW());

-- UsuarioRoles
INSERT INTO usuario_roles (id, usuario_id, rol_id, asignadoEn, activo) VALUES
('11aaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'd1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', NOW(), true),
('22bbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'e2222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', NOW(), true),
('33cccccc-cccc-cccc-cccc-cccccccccccc', 'f3333333-3333-3333-3333-333333333333', 'c3333333-3333-3333-3333-333333333333', NOW(), true);

-- UsuarioSucursales
-- sucursal_ref_id referencia la sucursal en ms-datos (ids 1..3 sembrados por su V3).
INSERT INTO usuario_sucursales (id, usuario_id, sucursal_ref_id, asignadoEn, activo) VALUES
('44dddddd-dddd-dddd-dddd-dddddddddddd', 'd1111111-1111-1111-1111-111111111111', 1, NOW(), true),
('55eeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'e2222222-2222-2222-2222-222222222222', 2, NOW(), true),
('66ffffff-ffff-ffff-ffff-ffffffffffff', 'f3333333-3333-3333-3333-333333333333', 3, NOW(), true);
