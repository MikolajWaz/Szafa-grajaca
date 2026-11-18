import { NextResponse } from "next/server";
import { getSettings } from "../../../lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const { active, round } = await getSettings();
  return NextResponse.json({ active, round }, { headers: { "Cache-Control": "no-store" } });
}
