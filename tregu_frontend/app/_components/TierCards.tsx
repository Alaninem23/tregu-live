"use client";
import { TIERS, TierName } from "../lib/entitlements";

type Tier = { price: number; yearly?: number; features: Record<string, boolean> };

export default function TierCards(props: {
  selectable?: boolean;
  selected?: TierName | null;
  onSelect?: (t: TierName) => void;
}) {
  const items = Object.entries(TIERS) as [TierName, Tier][];

  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
      {items.map(([name, data]) => {
        const picked = props.selectable && props.selected === name;
        return (
          <button
            key={name}
            type={props.selectable ? "button" : "button"}
            onClick={() => props.onSelect?.(name)}
            className={[
              "rounded-2xl border bg-white/80 p-6 text-left shadow-sm transition",
              picked ? "ring-2 ring-[var(--brand,#2563eb)]" : "hover:shadow-md",
            ].join(" ")}
            aria-pressed={picked ? "true" : "false"}
          >
            <div className="text-sm uppercase tracking-wide text-slate-500">{name}</div>
            <div className="mt-2 text-4xl font-bold">
              ${data.price}
              <span className="text-base font-medium text-slate-500">/mo</span>
            </div>
            {"yearly" in data && typeof data.yearly === "number" && (
              <div className="text-sm text-slate-500">or ${data.yearly}/yr</div>
            )}
            <ul className="mt-4 space-y-1 text-sm">
              {Object.keys(data.features).map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            {!props.selectable && (
              <div
                className="mt-6 w-full rounded-xl px-3 py-2 text-center text-white"
                style={{ background: "var(--brand, #2563eb)" }}
              >
                Choose {name}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
