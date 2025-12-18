import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getProductionUrl } from "@/utils/url";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);

  // Supabase가 자동으로 세션을 생성하므로, 여기서는 단순히 홈으로 리다이렉트
  // 실제 세션 확인은 클라이언트에서 처리됨
  // 로그인 후 원래 페이지로 리다이렉트하거나, 트리 ID가 있으면 트리 페이지로
  const redirectTo = requestUrl.searchParams.get("redirect_to") || "/";

  // 현재 환경 감지 (명확하게!)
  const isLocalhost =
    requestUrl.hostname === "localhost" ||
    requestUrl.hostname === "127.0.0.1" ||
    requestUrl.hostname === "0.0.0.0";

  // 환경에 따라 base URL 결정 (절대 혼동 방지!)
  const baseUrl = isLocalhost ? requestUrl.origin : getProductionUrl();

  // redirectTo 처리: 상대 경로면 baseUrl과 결합, 절대 URL이면 환경 검증
  let finalUrl: URL;
  try {
    finalUrl = new URL(redirectTo);
    // 절대 URL인 경우: 환경과 일치하지 않으면 baseUrl로 변경
    const redirectIsLocalhost =
      finalUrl.hostname === "localhost" ||
      finalUrl.hostname === "127.0.0.1" ||
      finalUrl.hostname === "0.0.0.0";

    // 환경 불일치 감지: 로컬 환경인데 프로덕션 URL이 오거나, 그 반대
    if (isLocalhost !== redirectIsLocalhost) {
      // 경로와 쿼리만 추출하여 올바른 baseUrl과 결합
      const pathAndQuery = redirectTo.replace(/^https?:\/\/[^/]+/, "") || "/";
      finalUrl = new URL(pathAndQuery, baseUrl);
    }
    // 프로덕션 환경에서 프로덕션 도메인이 아닌 경우도 baseUrl로 변경
    else if (
      !isLocalhost &&
      finalUrl.hostname !== new URL(getProductionUrl()).hostname
    ) {
      const pathAndQuery = redirectTo.replace(/^https?:\/\/[^/]+/, "") || "/";
      finalUrl = new URL(pathAndQuery, baseUrl);
    }
  } catch {
    // 상대 경로인 경우: baseUrl과 결합
    finalUrl = new URL(redirectTo, baseUrl);
  }

  // 최종 안전장치: 환경 불일치가 남아있으면 수정
  const finalIsLocalhost =
    finalUrl.hostname === "localhost" ||
    finalUrl.hostname === "127.0.0.1" ||
    finalUrl.hostname === "0.0.0.0";

  if (isLocalhost !== finalIsLocalhost) {
    const pathAndQuery = finalUrl.pathname + finalUrl.search;
    finalUrl = new URL(pathAndQuery || "/", baseUrl);
  }

  // 로그인 완료 토스트를 위한 쿼리 파라미터 추가
  finalUrl.searchParams.set("login_success", "true");

  return NextResponse.redirect(finalUrl);
}
