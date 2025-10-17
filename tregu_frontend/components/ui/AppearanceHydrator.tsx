"use client";
import { useEffect } from 'react';

type Mode = 'light'|'dark';

function getPreferredAppearance(): Mode {
  if (typeof window === 'undefined') return 'light';
  try {
    const stored = window.localStorage.getItem('appearance');
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {}
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

export default function AppearanceHydrator() {
  useEffect(() => {
    const mode = getPreferredAppearance();
    document.documentElement.setAttribute('data-appearance', mode);
  }, []);
  return null;
}
