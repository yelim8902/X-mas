"use client";

import Image from "next/image";
import { forwardRef, useMemo } from "react";

type Props = {
  hostName: string;
  treeSnapshot: string; // base64 이미지 데이터 URL
  summary: string;
  giftKeyword: string;
};

function clampSummary(summary: string) {
  const lines = summary
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  return lines.slice(0, 3).join("\n");
}

export const ShareCard = forwardRef<HTMLDivElement, Props>(function ShareCard(
  { hostName, treeSnapshot, summary, giftKeyword },
  ref
) {
  const toLine = useMemo(() => {
    const name = (hostName || "주인공").trim() || "주인공";
    return `To. ${name}`;
  }, [hostName]);

  const shortSummary = useMemo(() => clampSummary(summary), [summary]);

  return (
    <div
      ref={ref}
      className="relative aspect-[9/16] w-[min(92vw,420px)] bg-[#FFFEF5] shadow-2xl"
      style={{
        boxShadow:
          "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)",
        borderRadius: "3rem",
        overflow: "visible", // 잘림 방지
      }}
    >
      {/* 편지지 세로선 패턴 (트랜디한 디테일) */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            90deg,
            transparent,
            transparent 39px,
            #000 39px,
            #000 40px
          )`,
          borderRadius: "3rem",
        }}
      />

      {/* 내부 컨테이너 - overflow 제어 */}
      <div
        className="relative h-full overflow-hidden"
        style={{ borderRadius: "3rem" }}
      >
        <div className="relative flex h-full flex-col px-10 py-8">
          {/* Top: "To. [닉네임]" */}
          <div className="mb-4 text-left">
            <div className="text-xl font-bold tracking-tight text-slate-800">
              {toLine}
            </div>
          </div>

          {/* Center: Tree + Santa Area */}
          <div className="relative mb-6 flex-1 min-h-0">
            <div
              className="relative h-full w-full flex items-center justify-center gap-4"
              style={{ padding: "20px 0" }}
            >
              {/* 트리 스냅샷 이미지 */}
              <div className="relative flex-1 h-full">
                <img
                  src={treeSnapshot}
                  alt="tree"
                  className="h-full w-full object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.25)]"
                />
              </div>

              {/* 3D Santa - 트리 옆에 배치 */}
              <div
                className="relative flex-shrink-0"
                style={{ width: "140px", height: "140px" }}
              >
                <Image
                  src="/images/santa.png"
                  alt="santa"
                  fill
                  sizes="140px"
                  loading="lazy"
                  className="object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.2)]"
                />
              </div>
            </div>
          </div>

          {/* Bottom: Text Area */}
          <div className="relative pb-4">
            {/* Summary */}
            <div className="mb-4 whitespace-pre-wrap text-sm font-medium leading-relaxed text-slate-600">
              {shortSummary}
            </div>

            {/* Gift Keyword */}
            <div className="text-base font-bold text-slate-700 mb-1">
              🎁 2026년 선물:
            </div>
            <div className="text-5xl font-black tracking-tight text-christmas-red leading-none">
              {giftKeyword}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
