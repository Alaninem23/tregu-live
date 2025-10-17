import { NextResponse } from "next/server";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(req:Request){
  const form = await req.formData();
  const prompt = String(form.get("prompt")||"");
  return NextResponse.json({ ok:true, message:`(stub) Received: ${prompt}` });
}
