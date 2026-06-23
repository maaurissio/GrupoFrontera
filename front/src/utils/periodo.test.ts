import { describe, it, expect } from 'vitest';
import { ultimosMeses } from './periodo';

describe('ultimosMeses', () => {
  it('devuelve 6 meses consecutivos terminando en el período dado, en orden', () => {
    const meses = ultimosMeses('2026-06', 6);
    expect(meses.map((m) => m.periodo)).toEqual([
      '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06',
    ]);
  });

  it('cruza el límite de año correctamente', () => {
    const meses = ultimosMeses('2026-01', 3);
    expect(meses.map((m) => m.periodo)).toEqual(['2025-11', '2025-12', '2026-01']);
    expect(meses[0].full).toBe('Nov 2025');
    expect(meses[2].full).toBe('Ene 2026');
  });
});
