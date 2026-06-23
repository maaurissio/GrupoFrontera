import { describe, it, expect } from 'vitest';
import { validarRut, formatearRut } from './rut';

describe('validarRut', () => {
  it('devuelve true para un RUT/DV reales válidos', () => {
    expect(validarRut('12345678', '5')).toBe(true);
  });

  it('devuelve false si el DV no corresponde', () => {
    expect(validarRut('12345678', '6')).toBe(false);
  });

  it('maneja el dígito verificador K en mayúscula y minúscula', () => {
    expect(validarRut('6', 'K')).toBe(true);
    expect(validarRut('6', 'k')).toBe(true);
  });
});

describe('formatearRut', () => {
  it('separa los miles con puntos y agrega el DV en mayúscula', () => {
    expect(formatearRut('12345678', '5')).toBe('12.345.678-5');
    expect(formatearRut('12345678', 'k')).toBe('12.345.678-K');
  });
});
