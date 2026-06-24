// Las 3 unicas credenciales semilla del sistema (ver ms-users/import.sql) tienen, cada una,
// exactamente uno de estos roles. Administrador ve todo; Soporte y Gerente no acceden a
// Usuarios/Roles; Gerente ademas no puede crear ni editar Sucursales (solo lectura).
export function puedeVerUsuariosYRoles(roles: string[]): boolean {
  return roles.includes('ADMIN');
}

export function puedeGestionarSucursales(roles: string[]): boolean {
  return !roles.includes('GERENTE');
}
