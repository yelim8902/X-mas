/**
 * 프로덕션 URL을 반환하는 유틸리티 함수
 */
export function getProductionUrl(): string {
  return (
    process.env.NEXT_PUBLIC_PRODUCTION_URL || "https://x-mas-ashy.vercel.app"
  );
}

/**
 * 현재 환경에 맞는 base URL을 반환
 * - 로컬 개발 환경: window.location.origin
 * - 그 외: 프로덕션 URL
 * 
 * ⚠️ OAuth 리다이렉트용: 항상 프로덕션 URL 사용 (로컬 개발 환경 제외)
 */
export function getBaseUrl(): string {
  if (typeof window === "undefined") {
    return getProductionUrl();
  }

  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  return isLocalhost ? window.location.origin : getProductionUrl();
}

/**
 * OAuth 리다이렉트용 base URL (항상 프로덕션 URL 사용)
 * 로컬 개발 환경에서도 프로덕션 URL을 사용하여 Supabase OAuth 설정과 일치시킴
 */
export function getOAuthRedirectUrl(): string {
  return getProductionUrl();
}

/**
 * 게스트용 트리 링크 생성
 */
export function getGuestTreeUrl(treeId: string): string {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/?tree=${treeId}`;
}
