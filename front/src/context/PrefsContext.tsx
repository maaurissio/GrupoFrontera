import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface PrefsContextType {
  theme: string;
  density: string;
  setTheme: (t: string) => void;
  setDensity: (d: string) => void;
}

const PrefsContext = createContext<PrefsContextType | null>(null);

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [theme,   setThemeState]   = useState(() => localStorage.getItem('cord-theme-v2')   || 'dark');
  const [density, setDensityState] = useState(() => localStorage.getItem('cord-density-v2') || 'normal');

  function setTheme(t: string) {
    document.documentElement.classList.add('theme-transitioning');
    setTimeout(() => document.documentElement.classList.remove('theme-transitioning'), 380);
    setThemeState(t);
    localStorage.setItem('cord-theme-v2', t);
    setTimeout(() => window.dispatchEvent(new Event('prefs-changed')), 20);
  }

  function setDensity(d: string) {
    setDensityState(d);
    localStorage.setItem('cord-density-v2', d);
  }

  useEffect(() => {
    document.documentElement.dataset.theme   = theme;
    document.documentElement.dataset.density = density;
    requestAnimationFrame(() => window.dispatchEvent(new Event('prefs-changed')));
  }, [theme, density]);

  return (
    <PrefsContext.Provider value={{ theme, density, setTheme, setDensity }}>
      {children}
    </PrefsContext.Provider>
  );
}

export function usePrefs() {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error('usePrefs must be used inside PrefsProvider');
  return ctx;
}
