import * as React from 'react';

export function Button(
  { children, variant = 'primary', className = '', ...props }:
  { children: React.ReactNode; variant?: 'primary'|'surface'|'danger' } & React.ButtonHTMLAttributes<HTMLButtonElement>
) {
  const base = 'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2';
  const styles = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary-hover focus:ring-primary',
    surface: 'bg-surface border border-border text-text hover:bg-neutral-50 focus:ring-neutral-300',
    danger: 'bg-danger text-white hover:bg-red-600 focus:ring-red-400'
  }[variant];
  return (
    <button className={`${base} ${styles} ${className}`} {...props}>
      {children}
    </button>
  );
}
