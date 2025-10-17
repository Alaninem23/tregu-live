import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const TargetSchema = z.object({
  targetKey: z.string().min(1),
  siteId: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  periodStart: z.string().refine(v => !Number.isNaN(Date.parse(v)), "Invalid date"),
  periodEnd: z.string().refine(v => !Number.isNaN(Date.parse(v)), "Invalid date"),
  targetValue: z.coerce.number(),
  unit: z.enum(["number","currency","percent"]).default("number"),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const json = form.get("json") as string | null;  // client converts CSV/XLSX -> JSON array
  if (!json) return NextResponse.json({ ok:false, error:"Missing json" }, { status: 400 });
  let rows: unknown;
  try { rows = JSON.parse(json); } catch { return NextResponse.json({ ok:false, error:"Bad JSON" }, { status:400 }) }

  const parsed = Array.isArray(rows) ? rows.map((r)=>TargetSchema.safeParse(r)) : [];
  const valid = parsed.filter(p=>p.success).map((p:any)=>p.data);
  const invalid = parsed.filter(p=>!p.success).map((p:any)=>p.error?.flatten?.());

  // TODO: persist valid targets
  return NextResponse.json({ ok:true, imported: valid.length, rejected: invalid.length });
}
