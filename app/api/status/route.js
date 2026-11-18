import { NextResponse } from "next/server";
import { isActive } from "../../../lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const active = await isActive();
  return NextResponse.json({ active }, { headers: { "Cache-Control": "no-store" } });
}
