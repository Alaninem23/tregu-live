import { NextResponse } from "next/server";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(req:Request){
  const form = await req.formData();
  return NextResponse.json({ ok:true, queued:true, items:[...form.keys()] });
}
