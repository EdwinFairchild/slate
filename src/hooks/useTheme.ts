import { useState, useEffect } from 'react';
import type { Theme } from '../types';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme');
    return (stored as Theme) || 
      (window.matchMedia('(prefers-color-scheme: light)').matches ? 'dark' : 'light');
  });

  // Update the theme in localStorage and document element class
  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Function to get the current theme
  const getTheme = () => theme;

  return { theme, setTheme, getTheme };
}
