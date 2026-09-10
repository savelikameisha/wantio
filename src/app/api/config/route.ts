import { NextResponse } from "next/server";
// Public browser credentials only. RLS protects account data; no service key is exposed.
export function GET() {
  return NextResponse.json(
    {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(),
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
    },
    { headers: { "Cache-Control": "public, max-age=300" } },
  );
}
