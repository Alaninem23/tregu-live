import * as React from 'react';

export function Card(
  { title, subtitle, actions, children }:
  { title: string; subtitle?: string; actions?: React.ReactNode; children: React.ReactNode }
) {
  return (
    <section className="bg-surface border border-border rounded-2xl shadow p-5">
      <header className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-base font-semibold">{title}</h3>
          {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
        </div>
        {actions}
      </header>
      {children}
    </section>
  );
}
