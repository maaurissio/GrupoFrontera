import { describe, it, expect } from 'vitest';
import { ultimosMeses, formatearPeriodo, rangoMeses } from './periodo';

describe('ultimosMeses', () => {
  it('cruza el límite de año correctamente', () => {
    const meses = ultimosMeses('2026-01', 3);
    expect(meses.map((m) => m.periodo)).toEqual(['2025-11', '2025-12', '2026-01']);
    expect(meses[0].full).toBe('Nov 2025');
    expect(meses[2].full).toBe('Ene 2026');
  });
});

describe('formatearPeriodo', () => {
  it('convierte "YYYY-MM" al nombre largo del mes con el año', () => {
    expect(formatearPeriodo('2026-06')).toBe('Junio 2026');
    expect(formatearPeriodo('2025-01')).toBe('Enero 2025');
  });
});

describe('rangoMeses', () => {
  it('genera todos los meses entre desde y hasta, inclusive', () => {
    const meses = rangoMeses('2026-03', '2026-06');
    expect(meses.map((m) => m.periodo)).toEqual([
      '2026-03', '2026-04', '2026-05', '2026-06',
    ]);
  });

  it('limita el resultado a un máximo de 24 meses', () => {
    const meses = rangoMeses('2020-01', '2030-01');
    expect(meses).toHaveLength(24);
  });
});
