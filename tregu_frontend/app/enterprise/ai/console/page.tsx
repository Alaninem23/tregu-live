"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { PageHeader } from "@/components/ui/PageHeader";
import { SpeechToggles } from "@/components/ai/SpeechToggles";
import { PersonalityEditor } from "@/components/ai/PersonalityEditor";
import { DataConnect } from "@/components/ai/DataConnect";

type Avatar = { id:string; name:string; file:string };

export default function AIConsole() {
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState<string>("");
  const [personalities, setPersonalities] = useState<any[]>([]);
  const [selectedPersonality, setSelectedPersonality] = useState<string>("");

  useEffect(() => {
    fetch("/avatars/manifest.json").then(r=>r.json()).then(d=>setAvatars(d.avatars||[])).catch(()=>setAvatars([]));
    fetch("/enterprise/ai/personalities.json").then(r=>r.json()).then(setPersonalities).catch(()=>setPersonalities([]));
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="AI Manager" subtitle="Pick an avatar, configure personality, connect data, train, and ask." />
        <div className="flex items-center gap-4">
          <SpeechToggles />
          <Link className="text-sm underline text-muted hover:text-text" href="/enterprise">Back</Link>
        </div>
      </div>

      {/* Systems Assist deep-links */}
      <section className="bg-surface border border-border rounded-2xl shadow p-4">
        <div className="text-sm font-medium mb-2">Systems Assist</div>
        <div className="flex flex-wrap gap-2">
          {[
            {label:'Inventory', href:'/enterprise/inventory?ctx=inventory'},
            {label:'WMS', href:'/enterprise/wms?ctx=wms'},
            {label:'Manufacturing', href:'/enterprise/mrp?ctx=mfg'},
            {label:'Planning', href:'/enterprise/planning?ctx=planning'},
          ].map(s => (
            <Link key={s.label} href={s.href} className="px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-neutral-50">
              {s.label}
            </Link>
          ))}
        </div>
      </section>

      {/* Avatars */}
      <section className="bg-surface border border-border rounded-2xl shadow p-4">
        <div className="text-sm font-medium mb-2">Choose Avatar</div>
        <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
          {avatars.map(a=> (
            <button key={a.id} onClick={()=>setSelectedAvatar(a.id)}
              className={`p-2 rounded-xl border border-border hover:shadow ${selectedAvatar===a.id?'border-primary ring-2 ring-primary/20':''}`}>
              <Image src={a.file} alt={a.name} width={40} height={40} className="h-10 w-10 mx-auto"/>
              <div className="mt-1 text-[11px] text-muted text-center truncate">{a.name}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Personality */}
      <section className="bg-surface border border-border rounded-2xl shadow p-4">
        <div className="text-sm font-medium mb-2">Personality</div>
        <div className="flex flex-wrap gap-2">
          {personalities.map((p:any)=> (
            <button key={p.id} onClick={()=>setSelectedPersonality(p.id)}
              className={`px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-neutral-50 ${selectedPersonality===p.id?'border-primary ring-2 ring-primary/20':''}`}>
              {p.name}
            </button>
          ))}
        </div>
        <div className="mt-4">
          <PersonalityEditor />
        </div>
      </section>

      {/* Data Connect & Train */}
      <section className="bg-surface border border-border rounded-2xl shadow p-4">
        <div className="text-sm font-medium mb-2">Connect Data & Train</div>
        <div className="mb-3"><DataConnect /></div>
        <form className="flex flex-wrap items-center gap-3" onSubmit={async (e)=>{
          e.preventDefault();
          const fd = new FormData(e.currentTarget as HTMLFormElement);
          await fetch("/api/ai/train", { method: "POST", body: fd });
          alert("Training job submitted.");
        }}>
          <input type="file" name="files" multiple className="text-sm"/>
          <input type="url" name="sourceUrl" placeholder="https://docs.example.com/handbook" className="border border-border rounded-lg px-3 py-2 text-sm w-80 bg-surface text-text"/>
          <button className="px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary-hover">Train</button>
        </form>
      </section>

      {/* Ask AI */}
      <section className="bg-surface border border-border rounded-2xl shadow p-4">
        <div className="text-sm font-medium mb-2">Ask AI</div>
        <form className="flex items-center gap-2" onSubmit={async (e)=>{
          e.preventDefault();
          const fd = new FormData(e.currentTarget as HTMLFormElement);
          fd.append("avatarId", selectedAvatar);
          fd.append("personalityId", selectedPersonality);
          const r = await fetch("/api/ai/invoke", { method: "POST", body: fd });
          const j = await r.json();
          alert(j.message ?? "OK");
        }}>
          <input name="prompt" placeholder="Plan a cycle count for Site DAL-01 next week…" className="border border-border rounded-lg px-3 py-2 text-sm flex-1 bg-surface text-text"/>
          <button className="px-4 py-2 rounded-xl border border-border hover:bg-neutral-50">Send</button>
        </form>
      </section>
    </div>
  );
}
