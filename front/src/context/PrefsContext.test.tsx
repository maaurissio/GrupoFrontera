import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { PrefsProvider, usePrefs } from './PrefsContext';

function Probe() {
  const { theme, setTheme } = usePrefs();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button onClick={() => setTheme('light')}>cambiar</button>
    </div>
  );
}

describe('PrefsContext', () => {
  beforeEach(() => {
    localStorage.removeItem('cord-theme-v2');
    localStorage.removeItem('cord-density-v2');
    document.documentElement.removeAttribute('data-theme');
  });

  it('setTheme persiste en localStorage y actualiza document.documentElement.dataset.theme', async () => {
    render(
      <PrefsProvider>
        <Probe />
      </PrefsProvider>,
    );

    await act(async () => {
      screen.getByText('cambiar').click();
    });

    expect(localStorage.getItem('cord-theme-v2')).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(screen.getByTestId('theme').textContent).toBe('light');
  });

  it('usePrefs lanza un error cuando se usa fuera de PrefsProvider', () => {
    function Broken() {
      usePrefs();
      return null;
    }
    expect(() => render(<Broken />)).toThrow('usePrefs must be used inside PrefsProvider');
  });
});
