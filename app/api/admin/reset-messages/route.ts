import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/utils/supabaseAdmin";

export async function POST(req: Request) {
  const secret = process.env.XMAS_ADMIN_SECRET;
  const provided = req.headers.get("x-xmas-admin-secret") ?? "";

  if (!secret) {
    return NextResponse.json(
      { error: "Server is missing XMAS_ADMIN_SECRET" },
      { status: 500 }
    );
  }

  if (!provided || provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // id가 uuid인 경우도 있으므로, 타입 불일치 필터(neq -1) 대신 "항상 참" 필터로 전체 삭제
  const { error } = await supabaseAdmin
    .from("messages")
    .delete()
    .not("id", "is", null);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
