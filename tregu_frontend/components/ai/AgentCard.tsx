import * as React from 'react';
export function AgentCard({avatar,name,personality}:{avatar:string;name:string;personality:string}){
  return (
    <div className="flex items-center gap-3 bg-surface border border-border rounded-xl p-3">
      <img src={avatar} alt={name} className="h-10 w-10 rounded"/>
      <div>
        <div className="text-sm font-medium">{name}</div>
        <div className="text-xs text-muted">{personality}</div>
      </div>
    </div>
  );
}
