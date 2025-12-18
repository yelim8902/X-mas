import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getProductionUrl } from "@/utils/url";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);

  // Supabase가 자동으로 세션을 생성하므로, 여기서는 단순히 홈으로 리다이렉트
  // 실제 세션 확인은 클라이언트에서 처리됨
  // 로그인 후 원래 페이지로 리다이렉트하거나, 트리 ID가 있으면 트리 페이지로
  const redirectTo = requestUrl.searchParams.get("redirect_to") || "/";

  // ⚠️ 항상 프로덕션 URL 사용 (localhost 리다이렉트 문제 완전 방지)
  const PRODUCTION_URL = getProductionUrl();

  // redirectTo가 절대 URL인지 확인
  let finalUrl: URL;
  try {
    // 절대 URL인 경우
    finalUrl = new URL(redirectTo);

    // localhost, 127.0.0.1, 또는 프리뷰 URL이면 무조건 프로덕션 URL로 변경
    const isInvalidHost =
      finalUrl.hostname === "localhost" ||
      finalUrl.hostname === "127.0.0.1" ||
      finalUrl.hostname === "0.0.0.0" ||
      (finalUrl.hostname.includes(".vercel.app") &&
        (finalUrl.hostname.split(".")[0].length > 20 ||
          finalUrl.hostname.includes("-git-")));

    if (isInvalidHost) {
      // 경로와 쿼리만 추출하여 프로덕션 URL과 결합
      const pathAndQuery = redirectTo.replace(/^https?:\/\/[^/]+/, "") || "/";
      finalUrl = new URL(pathAndQuery, PRODUCTION_URL);
    } else if (finalUrl.hostname !== new URL(PRODUCTION_URL).hostname) {
      // 프로덕션 도메인이 아닌 다른 도메인이면 프로덕션 URL로 변경
      const pathAndQuery = redirectTo.replace(/^https?:\/\/[^/]+/, "") || "/";
      finalUrl = new URL(pathAndQuery, PRODUCTION_URL);
    }
  } catch {
    // 상대 경로인 경우 무조건 프로덕션 URL 사용
    finalUrl = new URL(redirectTo, PRODUCTION_URL);
  }

  // 최종 확인: localhost가 포함되어 있으면 무조건 프로덕션 URL로 변경
  if (
    finalUrl.hostname === "localhost" ||
    finalUrl.hostname === "127.0.0.1" ||
    finalUrl.hostname === "0.0.0.0"
  ) {
    const pathAndQuery = finalUrl.pathname + finalUrl.search;
    finalUrl = new URL(pathAndQuery || "/", PRODUCTION_URL);
  }

  return NextResponse.redirect(finalUrl);
}
