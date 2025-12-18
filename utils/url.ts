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
 * OAuth 리다이렉트용 base URL
 * - 로컬 개발 환경: localhost 사용 (Supabase 설정에 localhost 추가 필요)
 * - 프로덕션: 프로덕션 URL 사용
 */
export function getOAuthRedirectUrl(): string {
  // 서버 사이드에서는 프로덕션 URL 사용
  if (typeof window === "undefined") {
    return getProductionUrl();
  }

  // 클라이언트 사이드에서 localhost 감지
  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  return isLocalhost ? window.location.origin : getProductionUrl();
}

/**
 * 게스트용 트리 링크 생성 (새 URL 구조: /tree/{id})
 */
export function getGuestTreeUrl(treeId: string): string {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/tree/${treeId}`;
}

/**
 * 트리 페이지 경로 생성
 */
export function getTreePath(treeId: string): string {
  return `/tree/${treeId}`;
}

/**
 * 대시보드 경로
 */
export function getDashboardPath(): string {
  return "/dashboard";
}
