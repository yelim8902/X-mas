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
 * 게스트용 트리 링크 생성
 */
export function getGuestTreeUrl(treeId: string): string {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/?tree=${treeId}`;
}
