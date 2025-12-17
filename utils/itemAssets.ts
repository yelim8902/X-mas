import type { GiftColor, ItemType } from "@/utils/supabase";

// DB에는 가능한 한 "키"만 저장하고, 프론트에서 파일명으로 매핑합니다.
// - ornament: 'sock' | 'candy_cane' | 'ball' ...
// - gift: 'red' | 'green' | 'yellow' ...
//
// ⚠️ 호환: 예전 데이터가 'ornament-1', 'gift-red'처럼 파일명 베이스를 저장하고 있어도 그대로 렌더링되게 처리합니다.

export const ORNAMENT_DESIGNS = [
  { key: "sock", fileBase: "ornament-1" },
  { key: "candy_cane", fileBase: "ornament-2" },
  { key: "ball", fileBase: "ornament-3" },
  { key: "star", fileBase: "ornament-4" },
  { key: "bell", fileBase: "ornament-5" },
  { key: "snowflake", fileBase: "ornament-6" },
] as const;

export const GIFT_DESIGNS = [
  { key: "red", fileBase: "gift-red", giftColor: "red" as const },
  { key: "green", fileBase: "gift-green", giftColor: "green" as const },
  { key: "yellow", fileBase: "gift-yellow", giftColor: "yellow" as const },
] as const;

export function resolveItemFileBase(args: {
  itemType: ItemType;
  itemDesign?: string | null;
  giftColor?: GiftColor | null;
}): string {
  const raw = (args.itemDesign ?? "").trim();

  // legacy: already file base (contains hyphen convention we used)
  if (raw.startsWith("ornament-") || raw.startsWith("gift-")) return raw;

  if (args.itemType === "gift") {
    const key = raw || args.giftColor || "red";
    const found = GIFT_DESIGNS.find((d) => d.key === key);
    return found?.fileBase ?? "gift-red";
  }

  const key = raw || "sock";
  const found = ORNAMENT_DESIGNS.find((d) => d.key === key);
  return found?.fileBase ?? "ornament-1";
}
