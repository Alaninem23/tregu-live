"use client";
import { useEffect } from 'react';

function getPreferredTheme(): 'light'|'dark' {
  if (typeof window === 'undefined') return 'light';
  const stored = window.localStorage.getItem('theme');
  if (stored === 'light' || stored === 'dark') return stored;
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

export default function ThemeHydrator() {
  useEffect(() => {
    const theme = getPreferredTheme();
    document.documentElement.setAttribute('data-theme', theme);
  }, []);
  return null;
}
