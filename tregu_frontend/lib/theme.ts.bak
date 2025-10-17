export type Density = 'compact' | 'cozy' | 'comfortable';
export type BrandColor = string; // e.g. #3b82f6

export function applyTheme(color: BrandColor, density: Density) {
  if (typeof document === 'undefined') return;
  const r = document.documentElement;
  r.style.setProperty('--brand', color);
  r.style.setProperty('--density', density);
}

export function saveTheme(color: BrandColor, density: Density) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('tregu:theme:color', color);
  localStorage.setItem('tregu:theme:density', density);
}

export function loadTheme(): { color: BrandColor; density: Density } {
  if (typeof window === 'undefined') return { color: '#2563eb', density: 'comfortable' };
  return {
    color: localStorage.getItem('tregu:theme:color') || '#2563eb',
    density: (localStorage.getItem('tregu:theme:density') as Density) || 'comfortable',
  };
}