import * as React from 'react';
export function SpeechToggles(){
  const [enabled, setEnabled] = React.useState(false);
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <input type="checkbox" checked={enabled} onChange={(e)=>setEnabled(e.target.checked)} />
      <span className="text-muted">Speech {enabled? 'on':'off'}</span>
    </label>
  );
}
