import { Icon } from '../components/Icon';
import { Panel } from '../components/Primitives';
import { usePrefs } from '../context/PrefsContext';

export function ConfiguracionView() {
  const { theme, setTheme } = usePrefs();
  return (
    <Panel title="Interfaz">
      <div style={{ maxWidth: 460 }}>
        <div className="field">
          <label className="field-label">Tema</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {['dark', 'light'].map(t => {
              const on = theme === t;
              return (
                <button key={t} onClick={() => setTheme(t)} style={{
                  flex: 1, padding: '10px 12px', borderRadius: 8, textAlign: 'center', cursor: 'pointer',
                  fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500,
                  border: '1px solid ' + (on ? 'var(--link-fg)' : 'var(--bg-border)'),
                  background: on ? 'var(--bg-surface-3)' : 'var(--bg-surface-1)', color: 'var(--text-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                  <Icon name={t === 'dark' ? 'moon' : 'sun'} size={14} />{t === 'dark' ? 'Oscuro' : 'Claro'}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Panel>
  );
}
