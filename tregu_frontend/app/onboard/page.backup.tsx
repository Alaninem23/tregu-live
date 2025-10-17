"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../providers/AuthProvider";

type Mode = "personal" | "business";
type PlanId = "starter" | "standard" | "pro";

const PLANS: { id: PlanId; name: string; price: string; blurb: string }[] = [
  { id: "starter",  name: "Starter",  price: "$0/mo",  blurb: "Great to try Tregu" },
  { id: "standard", name: "Standard", price: "$19/mo", blurb: "Basics for small teams" },
  { id: "pro",      name: "Pro",      price: "$49/mo", blurb: "Advanced features + seats" },
];

function PlanCard({
  plan, selected, onSelect
}: {
  plan: (typeof PLANS)[number];
  selected: boolean;
  onSelect: (id: PlanId) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(plan.id)}
      className={[
        "rounded-2xl border p-5 text-left hover:shadow transition",
        selected ? "ring-2 ring-black bg-white" : "bg-white"
      ].join(" ")}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold">{plan.name}</div>
          <div className="text-slate-600 text-sm">{plan.blurb}</div>
        </div>
        <div className="text-xl font-bold">{plan.price}</div>
      </div>
    </button>
  );
}

export default function OnboardPage() {
  const router = useRouter();
  const { user, signUp, signIn, updateProfile } = useAuth();

  const [mode, setMode] = useState<Mode>("business");
  const [plan, setPlan] = useState<PlanId>("pro");

  const [bizName, setBizName] = useState("");
  const [seats, setSeats] = useState<number>(1);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const savedPlan = (localStorage.getItem("tregu_plan") as PlanId) || null;
    const savedSeats = Number(localStorage.getItem("tregu_seats") || "1");
    if (savedPlan && ["starter","standard","pro"].includes(savedPlan)) setPlan(savedPlan);
    if (!Number.isNaN(savedSeats) && savedSeats > 0) setSeats(savedSeats);
  }, []);

  const selectedPlanText = useMemo(() => {
    const p = PLANS.find(p => p.id === plan)!;
    return `${p.name} - ${p.price}`;
  }, [plan]);

  async function submit() {
    setBusy(true);
    setErr(null);
    try {
      // Save UI choices locally (dev)
      localStorage.setItem("tregu_plan", plan);
      localStorage.setItem("tregu_seats", String(seats));

      // Role maps to account intent; backend can treat it generically
      const role = mode === "business" ? "business" : "user";

      // 1) create account
      await signUp(email, password || "x", role);

      // 2) sign in (robust even if signup already returned token)
      await signIn(email);

      // 3) set local profile fields (dev/local only)
      if (mode === "business") {
        updateProfile({ name: bizName || undefined, account_type: "business" as any });
      } else {
        updateProfile({ account_type: "personal" as any });
      }

      // 4) go to dashboard
      router.push("/dashboard");
    } catch (e: any) {
      setErr(typeof e?.message === "string" ? e.message : "Could not create account");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container py-10 space-y-8">
      <div>
        <div className="text-2xl font-semibold">Create your account</div>
        <div className="text-slate-600 mt-1">Pick a mode and plan, then finish your details.</div>
      </div>

      {/* Mode toggle */}
      <div className="inline-flex rounded-xl border overflow-hidden">
        <button
          type="button"
          onClick={() => setMode("personal")}
          className={[
            "px-4 py-2 text-sm", mode === "personal" ? "bg-black text-white" : "bg-white"
          ].join(" ")}
        >
          Personal
        </button>
        <button
          type="button"
          onClick={() => setMode("business")}
          className={[
            "px-4 py-2 text-sm", mode === "business" ? "bg-black text-white" : "bg-white"
          ].join(" ")}
        >
          Business
        </button>
      </div>

      {/* Pricing */}
      <div className="grid md:grid-cols-3 gap-4">
        {PLANS.map(p => (
          <PlanCard key={p.id} plan={p} selected={plan === p.id} onSelect={setPlan} />
        ))}
      </div>

      <div className="text-slate-700">
        <span className="font-medium">Selected plan:</span> {selectedPlanText}
      </div>

      {/* Form */}
      <div className="grid md:grid-cols-2 gap-6">
        {mode === "business" ? (
          <>
            <div className="space-y-2">
              <div className="text-sm font-medium">Business / Organization name</div>
              <input
                className="input w-full"
                placeholder="Acme Co."
                value={bizName}
                onChange={e => setBizName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Seats</div>
              <input
                type="number"
                min={1}
                className="input w-full"
                value={seats}
                onChange={e => setSeats(Math.max(1, Number(e.target.value || 1)))}
              />
              <div className="text-xs text-slate-500">
                Seats = people you grant access to your business workspace.
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Work email</div>
              <input
                className="input w-full"
                placeholder="you@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Password</div>
              <input
                type="password"
                className="input w-full"
                placeholder="            "
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <div className="text-sm font-medium">Email</div>
              <input
                className="input w-full"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Password</div>
              <input
                type="password"
                className="input w-full"
                placeholder="            "
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </>
        )}
      </div>

      {err && <div className="text-sm text-rose-600">{err}</div>}

      <div>
        <button
          onClick={submit}
          disabled={busy || !email}
          className="btn btn-primary"
        >
          {busy
            ? "Creating…"
            : mode === "business"
              ? "Create Business account"
              : "Create Personal account"}
        </button>
      </div>
    </div>
  );
}
