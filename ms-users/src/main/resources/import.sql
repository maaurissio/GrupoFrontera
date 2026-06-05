-- Regiones
INSERT INTO regiones (id, nombre) VALUES
('f485b682-9484-4aa9-ad73-a3ac7d77be47', 'Region Metropolitana de Santiago'),
('45d3d1b1-160f-4738-8ee0-33fbd2c6d253', 'Region de Valparaiso'),
('c9dbd5b9-d7ab-488c-814f-7aeecb9f7b6e', 'Region del Biobio');

-- Ciudades
INSERT INTO ciudades (id, nombre, region_id) VALUES
('cc880288-88de-4e34-8a9c-871bf58a1e8e', 'Santiago',    'f485b682-9484-4aa9-ad73-a3ac7d77be47'),
('1add8072-4c65-4c8c-b3dd-ea9afcc6d753', 'Valparaiso',  '45d3d1b1-160f-4738-8ee0-33fbd2c6d253'),
('68c61287-0e27-40df-9b04-d4355c8bf39b', 'Concepcion',  'c9dbd5b9-d7ab-488c-814f-7aeecb9f7b6e');

-- Roles
INSERT INTO roles (id, nombre, descripcion, activo, creadoEn, actualizadoEn) VALUES
('a1111111-1111-1111-1111-111111111111', 'ADMIN',   'Administrador del sistema', true, NOW(), NOW()),
('b2222222-2222-2222-2222-222222222222', 'SOPORTE', 'Soporte tecnico',            true, NOW(), NOW()),
('c3333333-3333-3333-3333-333333333333', 'GERENTE', 'Gerente de sucursal',        true, NOW(), NOW());

-- Usuarios
INSERT INTO usuarios (id, rut, dv, nombre, apellido, email, telefono, estado, creadoEn, actualizadoEn) VALUES
('d1111111-1111-1111-1111-111111111111', '11111111', '1', 'Mauricio', 'Admin',   'admin@cordillera.cl',   '+56911111111', 'ACTIVO', NOW(), NOW()),
('e2222222-2222-2222-2222-222222222222', '22222222', '2', 'Carlos',   'Soporte', 'soporte@cordillera.cl', '+56922222222', 'ACTIVO', NOW(), NOW()),
('f3333333-3333-3333-3333-333333333333', '33333333', '3', 'Maria',    'Gerente', 'gerente@cordillera.cl', '+56933333333', 'ACTIVO', NOW(), NOW());

-- Sucursales
INSERT INTO sucursales (id, nombre, direccion, ciudad_id, activo, creadoEn, actualizadoEn) VALUES
('aa111111-1111-1111-1111-111111111111', 'Santiago Centro',  'Av. Libertador Bernardo O''Higgins 1234', 'cc880288-88de-4e34-8a9c-871bf58a1e8e', true, NOW(), NOW()),
('bb222222-2222-2222-2222-222222222222', 'Valparaiso Centro','Av. Argentina 567',                       '1add8072-4c65-4c8c-b3dd-ea9afcc6d753', true, NOW(), NOW()),
('cc333333-3333-3333-3333-333333333333', 'Concepcion Centro','Av. O''Higgins 890',                      '68c61287-0e27-40df-9b04-d4355c8bf39b', true, NOW(), NOW());

-- UsuarioRoles
INSERT INTO usuario_roles (id, usuario_id, rol_id, asignadoEn, activo) VALUES
('11aaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'd1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', NOW(), true),
('22bbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'e2222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', NOW(), true),
('33cccccc-cccc-cccc-cccc-cccccccccccc', 'f3333333-3333-3333-3333-333333333333', 'c3333333-3333-3333-3333-333333333333', NOW(), true);

-- UsuarioSucursales
INSERT INTO usuario_sucursales (id, usuario_id, sucursal_id, asignadoEn, activo) VALUES
('44dddddd-dddd-dddd-dddd-dddddddddddd', 'd1111111-1111-1111-1111-111111111111', 'aa111111-1111-1111-1111-111111111111', NOW(), true),
('55eeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'e2222222-2222-2222-2222-222222222222', 'bb222222-2222-2222-2222-222222222222', NOW(), true),
('66ffffff-ffff-ffff-ffff-ffffffffffff', 'f3333333-3333-3333-3333-333333333333', 'cc333333-3333-3333-3333-333333333333', NOW(), true);
