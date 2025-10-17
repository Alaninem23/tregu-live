import * as React from 'react';

export function PageHeader(
  { icon, title, subtitle }:
  { icon?: React.ReactNode; title: string; subtitle?: string }
) {
  return (
    <div className="flex items-center gap-3">
      {icon && (
        <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          {icon}
        </div>
      )}
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
      </div>
    </div>
  );
}
