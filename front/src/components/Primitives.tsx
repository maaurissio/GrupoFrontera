import type { CSSProperties, ReactNode, MouseEvent } from 'react';
import { Icon } from './Icon';

/* ---- Badge ---- */
interface BadgeProps { kind?: string; dot?: boolean; children: ReactNode; style?: CSSProperties; }
export function Badge({ kind = 'neutral', dot = true, children, style }: BadgeProps) {
  const cls = ({
    success: 'badge badge-success', warning: 'badge badge-warning',
    danger: 'badge badge-danger', info: 'badge badge-info',
    orange: 'badge badge-orange', yellow: 'badge badge-yellow', neutral: 'badge',
  } as Record<string, string>)[kind] || 'badge';
  return (
    <span className={cls} style={style}>
      {dot && kind !== 'neutral' && <span className="dot" />}
      {children}
    </span>
  );
}

/* ---- Delta ---- */
interface DeltaProps { dir?: 'up' | 'down' | 'flat'; children: ReactNode; }
export function Delta({ dir, children }: DeltaProps) {
  const cls = dir === 'up' ? 'delta delta-up' : dir === 'down' ? 'delta delta-down' : 'delta delta-flat';
  const ic = dir === 'up' ? 'arrow-up-right' : dir === 'down' ? 'arrow-down-right' : 'minus';
  return (
    <span className={cls}>
      <Icon name={ic} size={12} />
      {children}
    </span>
  );
}

/* ---- Button ---- */
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm';
  icon?: string;
  iconRight?: string;
  onClick?: () => void;
  children?: ReactNode;
  title?: string;
  style?: CSSProperties;
  disabled?: boolean;
  type?: 'button' | 'submit';
}
export function Button({ variant = 'secondary', size, icon, iconRight, onClick, children, title, style, disabled, type = 'button' }: ButtonProps) {
  const cls = ['btn', 'btn-' + variant, size === 'sm' ? 'btn-sm' : '', !children ? 'btn-icon' : '']
    .filter(Boolean).join(' ');
  return (
    <button className={cls} onClick={onClick} title={title} style={style} disabled={disabled} type={type}>
      {icon && <Icon name={icon} size={size === 'sm' ? 14 : 16} />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === 'sm' ? 14 : 16} />}
    </button>
  );
}

/* ---- Avatar ---- */
export function Avatar({ initials, size = 28 }: { initials: string; size?: number }) {
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size <= 24 ? 11 : 12 }}>
      {initials}
    </span>
  );
}

/* ---- ColorAvatar ---- */
const AVATAR_HUES = ['#3B82F6','#22C55E','#F97316','#EAB308','#8B5CF6','#EC4899','#14B8A6','#EF4444'];
export function avatarColor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_HUES[h % AVATAR_HUES.length];
}
export function ColorAvatar({ name, initials, size = 28 }: { name?: string; initials: string; size?: number }) {
  const c = avatarColor(name || initials);
  return (
    <span style={{
      width: size, height: size, borderRadius: '50%', flex: 'none',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size <= 24 ? 10 : 11, fontWeight: 600, fontFamily: 'var(--font-sans)',
      color: c, background: c + '22', border: '1px solid ' + c + '55',
    }}>{initials}</span>
  );
}

/* ---- Switch ---- */
export function Switch({ on, onClick }: { on: boolean; onClick: () => void }) {
  return <span className={'switch' + (on ? ' on' : '')} onClick={onClick} role="switch" aria-checked={on} />;
}

/* ---- KpiCard ---- */
interface KpiDef {
  id: string; label: string; value: string; icon: string; accent?: string;
  delta?: string; dir?: 'up' | 'down' | 'flat'; badge?: { text: string; kind: string }; sub?: string; desc?: string;
}
export function KpiCard({ kpi }: { kpi: KpiDef }) {
  return (
    <div className="card card-hover kpi-card" style={{ padding: '18px 20px' }}>
      <div className="kpi-head">
        <span className="kpi-label">{kpi.label}</span>
        <span className="kpi-ico"><Icon name={kpi.icon} size={16} /></span>
      </div>
      <div className="kpi-value">{kpi.value}</div>
      <div className="kpi-foot">
        {kpi.delta && <Delta dir={kpi.dir}>{kpi.delta.replace(/[+\-−]/, '')}</Delta>}
        {kpi.badge && <Badge kind={kpi.badge.kind}>{kpi.badge.text}</Badge>}
        {kpi.sub && <span>{kpi.sub}</span>}
      </div>
    </div>
  );
}

/* ---- PageHead ---- */
export function PageHead({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
      <div>
        <h1 className="ds-h1" style={{ margin: 0 }}>{title}</h1>
        {subtitle && <p className="ds-sm" style={{ margin: '6px 0 0' }}>{subtitle}</p>}
      </div>
      <div style={{ display: 'flex', gap: 10, flex: 'none' }}>{children}</div>
    </div>
  );
}

/* ---- Panel ---- */
interface PanelProps {
  title?: ReactNode; action?: ReactNode; children: ReactNode;
  style?: CSSProperties; bodyStyle?: CSSProperties;
}
export function Panel({ title, action, children, style, bodyStyle }: PanelProps) {
  return (
    <div className="card" style={{ padding: 0, ...style }}>
      {(title || action) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--bg-border)' }}>
          <span className="ds-h3">{title}</span>
          {action}
        </div>
      )}
      <div style={{ padding: 18, ...bodyStyle }}>{children}</div>
    </div>
  );
}

/* ---- Modal overlay ---- */
export function ModalOverlay({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(2px)' }}
    >
      <div onClick={(e: MouseEvent) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
