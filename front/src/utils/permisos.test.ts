import { describe, it, expect } from 'vitest';
import { puedeVerUsuariosYRoles, puedeGestionarSucursales, puedeEditarKpis } from './permisos';

describe('puedeVerUsuariosYRoles', () => {
  it('solo permite a ADMIN', () => {
    expect(puedeVerUsuariosYRoles(['ADMIN'])).toBe(true);
    expect(puedeVerUsuariosYRoles(['SOPORTE'])).toBe(false);
    expect(puedeVerUsuariosYRoles(['GERENTE'])).toBe(false);
    expect(puedeVerUsuariosYRoles([])).toBe(false);
  });
});

describe('puedeGestionarSucursales', () => {
  it('permite a todos salvo a GERENTE', () => {
    expect(puedeGestionarSucursales(['ADMIN'])).toBe(true);
    expect(puedeGestionarSucursales(['SOPORTE'])).toBe(true);
    expect(puedeGestionarSucursales(['GERENTE'])).toBe(false);
    expect(puedeGestionarSucursales(['ADMIN', 'GERENTE'])).toBe(false);
  });
});

describe('puedeEditarKpis', () => {
  it('permite a GERENTE y a ADMIN', () => {
    expect(puedeEditarKpis(['ADMIN'])).toBe(true);
    expect(puedeEditarKpis(['GERENTE'])).toBe(true);
    expect(puedeEditarKpis(['SOPORTE'])).toBe(false);
    expect(puedeEditarKpis([])).toBe(false);
  });
});
