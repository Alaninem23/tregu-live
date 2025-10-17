import { NextResponse } from "next/server";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(){ return NextResponse.json({ ok:true, agents:[] }); }
export async function POST(req:Request){
  const body = await req.json().catch(()=> ({}));
  return NextResponse.json({ ok:true, saved: body });
}
