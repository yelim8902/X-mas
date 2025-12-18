import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);

  // Supabase가 자동으로 세션을 생성하므로, 여기서는 단순히 홈으로 리다이렉트
  // 실제 세션 확인은 클라이언트에서 처리됨
  // 로그인 후 원래 페이지로 리다이렉트하거나, 트리 ID가 있으면 트리 페이지로
  const redirectTo = requestUrl.searchParams.get("redirect_to") || "/";

  // 프로덕션 URL 사용 (localhost나 프리뷰 URL 대신)
  const PRODUCTION_URL =
    process.env.NEXT_PUBLIC_PRODUCTION_URL || "https://x-mas-ashy.vercel.app";

  // redirectTo가 절대 URL인지 확인
  let finalUrl: URL;
  try {
    // 절대 URL인 경우 그대로 사용
    finalUrl = new URL(redirectTo);
    // localhost나 프리뷰 URL이면 프로덕션 URL로 변경
    if (
      finalUrl.hostname === "localhost" ||
      finalUrl.hostname === "127.0.0.1" ||
      (finalUrl.hostname.includes(".vercel.app") &&
        (finalUrl.hostname.split(".")[0].length > 20 ||
          finalUrl.hostname.includes("-git-")))
    ) {
      finalUrl = new URL(redirectTo, PRODUCTION_URL);
    }
  } catch {
    // 상대 경로인 경우 프로덕션 URL 사용
    finalUrl = new URL(redirectTo, PRODUCTION_URL);
  }

  return NextResponse.redirect(finalUrl);
}
