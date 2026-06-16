export const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export interface SerieMes { periodo: string; corto: string; full: string }

// Devuelve los últimos `count` meses terminando en `periodo` (incl.), cruzando años correctamente.
export function ultimosMeses(periodo: string, count: number): SerieMes[] {
  const [y, m] = periodo.split('-').map(Number);
  const out: SerieMes[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(y, m - 1 - i, 1);
    const yy = d.getFullYear();
    const corto = MESES_CORTOS[d.getMonth()];
    out.push({ periodo: `${yy}-${String(d.getMonth() + 1).padStart(2, '0')}`, corto, full: `${corto} ${yy}` });
  }
  return out;
}

export interface ChartSeries { months: string[]; ventas: number[]; tx: number[]; fullLabels: string[] }
