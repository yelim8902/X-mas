import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);

  // Supabase가 자동으로 세션을 생성하므로, 여기서는 단순히 홈으로 리다이렉트
  // 실제 세션 확인은 클라이언트에서 처리됨
  // 로그인 후 원래 페이지로 리다이렉트하거나, 트리 ID가 있으면 트리 페이지로
  const redirectTo = requestUrl.searchParams.get("redirect_to") || "/";
  return NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
}
