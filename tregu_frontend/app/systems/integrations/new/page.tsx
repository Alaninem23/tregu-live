'use client';
export const dynamic = 'force-dynamic';


import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function NewIntegration() {
  const sp = useSearchParams();
  const kind = sp?.get("kind") || "shopify";
  const router = useRouter();
  const [values, setValues] = useState<Record<string,string>>({});
  const fields = useMemo(() => {
    switch (kind) {
      case "shopify": return [{k:"shop",l:"Shop Domain"}, {k:"token",l:"Access Token"}];
      case "square": return [{k:"location",l:"Location ID"}, {k:"token",l:"Access Token"}];
      case "woocommerce": return [{k:"url",l:"Store URL"}, {k:"key",l:"Consumer Key"}, {k:"secret",l:"Consumer Secret"}];
      case "webhook": return [{k:"url",l:"Webhook URL"}, {k:"secret",l:"Shared Secret"}];
      default: return [{k:"config",l:"Config"}];
    }
  }, [kind]);

  const save = async () => {
    if (typeof window !== "undefined") {
      const key = "tregu:integrations";
      const all = JSON.parse(localStorage.getItem(key) || "{}");
      all[kind] = values;
      localStorage.setItem(key, JSON.stringify(all));
    }
    router.replace("/systems/integrations");
  };

  return (
    <div className="container py-8 space-y-6">
      <div className="text-2xl font-semibold">Configure: {kind}</div>

      <div className="rounded-2xl border p-6 grid md:grid-cols-2 gap-4">
        {fields.map(f => (
          <div key={f.k}>
            <div className="text-sm mb-1">{f.l}</div>
            <input className="input w-full" value={values[f.k] || ""} onChange={e=>setValues(v=>({...v,[f.k]:e.target.value}))} />
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button className="btn" onClick={()=>router.back()}>Cancel</button>
        <button className="btn btn-primary" onClick={save}>Save</button>
      </div>
    </div>
  );
}