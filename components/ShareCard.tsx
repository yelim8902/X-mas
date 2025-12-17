"use client";

import Image from "next/image";
import { forwardRef, useMemo } from "react";
import type { MessageRow, ItemType } from "@/utils/supabase";
import { resolveItemFileBase } from "@/utils/itemAssets";

type Props = {
  hostName: string;
  treeSrc: string;
  summary: string;
  giftKeyword: string;
  items: MessageRow[];
};

function clampSummary(summary: string) {
  const lines = summary
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  return lines.slice(0, 3).join("\n");
}

export const ShareCard = forwardRef<HTMLDivElement, Props>(function ShareCard(
  { hostName, treeSrc, summary, giftKeyword, items },
  ref
) {
  const toLine = useMemo(() => {
    const name = (hostName || "주인공").trim() || "주인공";
    return `To. ${name}`;
  }, [hostName]);

  const shortSummary = useMemo(() => clampSummary(summary), [summary]);

  function stableRand(seed: number) {
    let t = seed >>> 0;
    return () => {
      t += 0x6d2b79f5;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hashSeed(input: string) {
    let h = 2166136261;
    for (let i = 0; i < input.length; i++) {
      h ^= input.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  const placements = useMemo(() => {
    const out: Record<
      string,
      {
        leftPct: number;
        topPct?: number;
        bottomPct?: number;
        size: number;
        rotate: number;
      }
    > = {};

    for (const m of items) {
      const id = String(m.id);
      const rand = stableRand(hashSeed(id));
      const type = (m.item_type ?? "ornament") as ItemType;
      if (type === "gift") {
        const u = rand();
        const centerBias = 0.5 + (u - 0.5) * 0.75;
        const leftPct = 18 + centerBias * 64;
        const bottomPct = -2 + rand() * 12;
        const rotate = -14 + rand() * 28;
        const size = Math.round(64 + rand() * 26); // 카드에서는 조금 더 큼직하게
        out[id] = { leftPct, bottomPct, size, rotate };
      } else {
        const topMin = 22;
        const topMax = 70;
        const t = rand();
        const topPct = topMin + t * (topMax - topMin);
        const yNorm = (topPct - topMin) / (topMax - topMin);
        const halfMin = 12;
        const halfMax = 34;
        const half = halfMin + yNorm * (halfMax - halfMin);
        const center = 50;
        const leftMin = Math.max(10, center - half);
        const leftMax = Math.min(90, center + half);
        const leftPct = leftMin + rand() * (leftMax - leftMin);
        const rotate = -18 + rand() * 36;
        const size = Math.round(34 + rand() * 14);
        out[id] = { leftPct, topPct, size, rotate };
      }
    }
    return out;
  }, [items]);

  return (
    <div
      ref={ref}
      className="relative aspect-[9/16] w-[min(92vw,420px)] overflow-hidden rounded-[32px] bg-[#FFFDF5] shadow-[0_28px_80px_rgba(25,50,80,0.18)]"
    >
      {/* paper bg (asset) */}
      <Image
        src="/images/paper-bg.png"
        alt="paper texture"
        fill
        sizes="420px"
        className="object-cover opacity-95"
      />
      {/* paper glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.85),transparent_55%),radial-gradient(circle_at_85%_85%,rgba(255,228,205,0.35),transparent_55%)]" />

      <div className="relative flex h-full flex-col px-6 pb-6 pt-7">
        {/* Top */}
        <div className="flex items-start justify-between">
          <div
            className="text-[22px] font-extrabold tracking-tight text-slate-800"
            style={{
              fontFamily:
                "ui-rounded, system-ui, -apple-system, 'Nunito', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif",
            }}
          >
            {toLine}
          </div>
          <div className="rounded-full bg-white/70 px-3 py-1 text-xs font-extrabold text-slate-700 ring-1 ring-black/5">
            Santa Letter
          </div>
        </div>

        {/* Tree (most important) + Items overlay */}
        <div className="mt-5 relative h-[52%] w-full">
          <div className="relative mx-auto h-full w-full px-2">
            <Image
              src={treeSrc}
              alt="tree"
              fill
              sizes="420px"
              className="object-contain drop-shadow-[0_28px_32px_rgba(25,50,80,0.18)]"
            />

            {/* overlay items on top of tree area */}
            <div className="absolute inset-0">
              {items.map((m) => {
                const id = String(m.id);
                const p = placements[id];
                const type = (m.item_type ?? "ornament") as ItemType;
                const fileBase = resolveItemFileBase({
                  itemType: type,
                  itemDesign: m.item_design,
                  giftColor: m.gift_color,
                });
                const src = `/images/${fileBase}.png`;
                const size = p?.size ?? (type === "gift" ? 72 : 44);
                const box = Math.round(size * 1.28); // rotate padding to avoid clipping
                return (
                  <div
                    key={id}
                    className="absolute overflow-visible"
                    style={{
                      left: `${p?.leftPct ?? 50}%`,
                      top:
                        type === "ornament" ? `${p?.topPct ?? 44}%` : undefined,
                      bottom:
                        type === "gift" ? `${p?.bottomPct ?? 6}%` : undefined,
                      width: box,
                      height: box,
                      transform:
                        type === "gift"
                          ? "translate(-50%, 0)"
                          : "translate(-50%, -50%)",
                    }}
                  >
                    <div
                      className="absolute inset-0"
                      style={{ transform: `rotate(${p?.rotate ?? 0}deg)` }}
                    >
                      <Image
                        src={src}
                        alt={type === "gift" ? "gift" : "ornament"}
                        fill
                        sizes="96px"
                        className="p-2 object-contain drop-shadow-[0_10px_10px_rgba(25,50,80,0.16)]"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-5 rounded-[28px] border border-black/5 bg-white/60 p-4 shadow-[inset_0_2px_0_rgba(255,255,255,0.7),_0_18px_30px_rgba(25,50,80,0.10)] backdrop-blur-sm">
          <div className="text-xs font-extrabold text-slate-600">
            산타의 요약
          </div>
          <div className="mt-1 whitespace-pre-wrap text-[13px] font-semibold leading-relaxed text-slate-800">
            {shortSummary}
          </div>

          <div className="mt-4 rounded-2xl bg-[#FFE9D6]/70 px-4 py-3 ring-1 ring-black/5">
            <div className="text-xs font-extrabold text-slate-700">
              2026년 당신을 위한 선물
            </div>
            <div className="mt-1 text-[22px] font-black tracking-tight text-christmas-red">
              {giftKeyword}
            </div>
          </div>
        </div>

        {/* Stamp badge */}
        <div className="absolute bottom-16 right-6 rotate-6">
          <div className="relative h-20 w-20 drop-shadow-[0_22px_36px_rgba(25,50,80,0.18)]">
            <Image
              src="/images/santa-stamp.png"
              alt="santa stamp"
              fill
              sizes="80px"
              className="object-contain"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 text-center text-[11px] font-semibold text-slate-500">
          Created by My Christmas Tree
        </div>
      </div>
    </div>
  );
});
