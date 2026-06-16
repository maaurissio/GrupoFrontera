import { useState, useEffect } from 'react';

interface ChartData { months: string[]; ventas: number[]; tx: number[]; fullLabels?: string[]; }

function clp(millions: number) {
  const n = Math.round(millions * 1000000);
  return '$' + n.toLocaleString('es-CL');
}

function getCSSVar(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function getChartLineColor() {
  return document.documentElement.dataset.theme === 'light' ? '#1A1916' : '#FFFFFF';
}

export function LineChart({ data, height = 220 }: { data: ChartData; height?: number }) {
  const { months, ventas, tx, fullLabels } = data;
  const [hover, setHover] = useState(ventas.length - 1);
  const [accent, setAccent] = useState(() => getCSSVar('--color-info') || '#3B82F6');
  const [lineColor, setLineColor] = useState(getChartLineColor);

  useEffect(() => {
    const update = () => {
      setAccent(getCSSVar('--color-info') || '#3B82F6');
      setLineColor(getChartLineColor());
    };
    window.addEventListener('accent-changed', update);
    window.addEventListener('prefs-changed', update);
    return () => { window.removeEventListener('accent-changed', update); window.removeEventListener('prefs-changed', update); };
  }, []);

  const single = months.length === 1;
  const W = 760, H = height, padL = 40, padR = 16, padTop = 16, padBot = 30;
  const max = Math.max(...ventas) * 1.12 || 1;
  const min = Math.min(...ventas) * 0.82;
  const span = (max - min) || 1;
  const n = months.length;
  const x = (i: number) => padL + (n === 1 ? (W - padL - padR) / 2 : (i * (W - padL - padR)) / (n - 1));
  const y = (v: number) => padTop + (1 - (v - min) / span) * (H - padTop - padBot);
  const path = ventas.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const area = `${path} L${x(n - 1)},${H - padBot} L${x(0)},${H - padBot} Z`;
  const yticks = [max, (max + min) / 2, min];

  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ display: 'block' }}
        onMouseLeave={() => setHover(ventas.length - 1)}>
        <defs>
          <linearGradient id="chartfill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.12" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((t, i) => {
          const gy = padTop + t * (H - padTop - padBot);
          return <line key={i} x1={padL} y1={gy} x2={W - padR} y2={gy} style={{ stroke: 'var(--bg-border)', opacity: 0.8 }} />;
        })}
        {yticks.map((v, i) => (
          <text key={i} x={padL - 8} y={padTop + i * (H - padTop - padBot) / 2 + 4}
            textAnchor="end" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--text-disabled)' }}>
            {Math.round(v)}M
          </text>
        ))}
        {!single && (
          <>
            <path d={area} fill="url(#chartfill)" />
            <path d={path} fill="none" stroke={lineColor} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          </>
        )}
        <line x1={x(hover)} y1={padTop} x2={x(hover)} y2={H - padBot} style={{ stroke: 'var(--bg-border-strong)' }} />
        <circle cx={x(hover)} cy={y(ventas[hover])} r={single ? 5 : 4} fill={lineColor} style={{ stroke: 'var(--bg-base)' }} strokeWidth="2.5" />
        {months.map((_m, i) => (
          <rect key={i} x={x(i) - (W / Math.max(n, 2)) / 2} y={0}
            width={W / Math.max(n, 2)} height={H} fill="transparent"
            onMouseEnter={() => setHover(i)} style={{ cursor: 'crosshair' }} />
        ))}
        {months.map((m, i) => (
          <text key={i} x={x(i)} y={H - 9} textAnchor="middle"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fill: i === hover ? 'var(--text-secondary)' : 'var(--text-disabled)' }}>
            {m}
          </text>
        ))}
      </svg>
      <div style={{
        position: 'absolute', top: 8,
        left: `clamp(60px, ${(x(hover) / W) * 100}%, calc(100% - 130px))`,
        transform: 'translateX(-50%)',
        background: 'var(--bg-surface-3)', border: '1px solid var(--bg-border-strong)',
        borderRadius: 8, padding: '8px 11px', pointerEvents: 'none',
        boxShadow: 'var(--shadow-pop)', whiteSpace: 'nowrap',
      }}>
        <div className="ds-eyebrow" style={{ marginBottom: 5 }}>{fullLabels?.[hover] ?? months[hover]}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 600, color: 'var(--text-white)' }}>{clp(ventas[hover])}</div>
        <div className="ds-sm" style={{ fontSize: 11, marginTop: 2 }}>{tx[hover].toLocaleString('es-CL')} transacciones</div>
      </div>
    </div>
  );
}
