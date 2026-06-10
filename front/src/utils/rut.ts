export function validarRut(rut: string, dv: string): boolean {
  const clean = rut.replace(/\./g, '').replace(/-/g, '');
  const num = parseInt(clean, 10);
  if (isNaN(num) || num <= 0) return false;

  let suma = 0;
  let factor = 2;
  let n = num;
  while (n > 0) {
    suma += (n % 10) * factor;
    n = Math.floor(n / 10);
    factor = factor === 7 ? 2 : factor + 1;
  }
  const resto = 11 - (suma % 11);
  let dvEsperado: string;
  if (resto === 11) dvEsperado = '0';
  else if (resto === 10) dvEsperado = 'K';
  else dvEsperado = String(resto);

  return dv.toUpperCase() === dvEsperado;
}

export function formatearRut(rut: string, dv: string): string {
  const clean = rut.replace(/\D/g, '');
  const formatted = clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formatted}-${dv.toUpperCase()}`;
}
