"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useRef } from "react";
import type { MessageRow, ItemType } from "@/utils/supabase";
import { resolveItemFileBase } from "@/utils/itemAssets";

// 순수 함수들을 컴포넌트 외부로 이동 (최적화)
function stableRand(seed: number) {
  // mulberry32
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(input: string) {
  // FNV-1a 32bit
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

type Props = {
  messages: MessageRow[];
  treeImageSrc: string;
  lastGiftId: string | null;
  draggingItemId: string | null;
  hoveredItemId: string | null;
  onItemClick: (message: MessageRow) => void;
  onItemHoverStart: (id: string) => void;
  onItemHoverEnd: () => void;
  onDragStart: (id: string) => void;
  onDragEnd: (id: string, message: MessageRow, event: any, info: any) => void;
  isGiftUnlocked: boolean;
  isMounted: boolean;
  treeItemsContainerRef: React.RefObject<HTMLDivElement>;
};

export function TreeView({
  messages,
  treeImageSrc,
  lastGiftId,
  draggingItemId,
  hoveredItemId,
  onItemClick,
  onItemHoverStart,
  onItemHoverEnd,
  onDragStart,
  onDragEnd,
  isGiftUnlocked,
  isMounted,
  treeItemsContainerRef,
}: Props) {
  // 아이템 배치 계산
  const itemPlacements = useMemo(() => {
    const out: Record<
      string,
      {
        leftPct: number;
        topPct?: number;
        bottomPct?: number;
        size: number;
        rotate: number;
        z: number;
      }
    > = {};

    for (const m of messages) {
      const id = String(m.id);
      const rand = stableRand(hashSeed(id));
      const type = (m.item_type ?? "ornament") as ItemType;

      if (type === "gift") {
        // 선물: 밑동에 더 모이게 + 확실히 더 크게
        const u = rand();
        const centerBias = 0.5 + (u - 0.5) * 0.75; // 0.125~0.875 근처
        const leftPct = 18 + centerBias * 64; // 18~82
        const bottomPct = -2 + rand() * 12; // -2~10
        const rotate = -14 + rand() * 28; // 살짝만 비틀기
        const size = Math.round(52 + rand() * 28); // 52~80 (더 큼직하게)
        out[id] = { leftPct, bottomPct, size, rotate, z: 20 };
      } else {
        // 오너먼트: 트리 실루엣(콘/삼각형)을 따라 배치
        const topMin = 20;
        const topMax = 70;
        const t = rand(); // 0..1
        const topPct = topMin + t * (topMax - topMin); // 20~70

        // topPct를 0..1로 정규화 (0=꼭대기, 1=아래쪽)
        const yNorm = (topPct - topMin) / (topMax - topMin);

        // 좌우 반폭: 위(0)에서는 좁게, 아래(1)에서는 넓게
        const halfMin = 12;
        const halfMax = 34;
        const half = halfMin + yNorm * (halfMax - halfMin);

        const center = 50;
        const leftMin = Math.max(10, center - half);
        const leftMax = Math.min(90, center + half);
        const leftPct = leftMin + rand() * (leftMax - leftMin);

        const rotate = -18 + rand() * 36;
        const size = Math.round(32 + rand() * 16); // 32~48 (더 크게)
        out[id] = { leftPct, topPct, size, rotate, z: 20 };
      }
    }
    return out;
  }, [messages]);

  return (
    <div className="relative overflow-hidden rounded-[44px] border border-white/40 bg-white/30 p-4 shadow-[0_30px_70px_rgba(25,50,80,0.16)] backdrop-blur-lg sm:p-6">
      <div className="relative aspect-[1/1.05] w-full">
        <Image
          src={treeImageSrc}
          alt="3D Christmas tree"
          fill
          priority
          sizes="(max-width: 640px) 82vw, 420px"
          className="object-contain"
        />
      </div>

      {/* Items (inside tree container) */}
      <div
        className="absolute inset-0"
        id="tree-container"
        ref={treeItemsContainerRef}
      >
        {messages.map((m) => {
          const id = String(m.id);
          const p = itemPlacements[id];
          const type = (m.item_type ?? "ornament") as ItemType;
          const fileBase = resolveItemFileBase({
            itemType: type,
            itemDesign: m.item_design,
            giftColor: m.gift_color,
          });
          const src = `/images/${fileBase}.png`;
          const isNew = lastGiftId && String(m.id) === String(lastGiftId);
          const baseRot = p?.rotate ?? 0;
          const isDragging = draggingItemId === id;

          // 위치 계산 (드래그 중에는 Framer Motion이 transform으로 처리)
          const leftPct = p?.leftPct ?? 50;
          const topPct = type === "ornament" ? p?.topPct : undefined;
          const bottomPct = type === "gift" ? p?.bottomPct : undefined;

          return (
            <motion.button
              key={String(m.id)}
              type="button"
              initial={{
                opacity: 0,
                scale: 0.5,
                rotate: baseRot - 12,
              }}
              animate={{
                opacity: 1,
                scale: isDragging ? 1.1 : 1,
                rotate: isDragging
                  ? baseRot
                  : [
                      baseRot - 12,
                      baseRot + 12,
                      baseRot - 7,
                      baseRot + 7,
                      baseRot,
                    ],
              }}
              transition={{
                rotate: {
                  duration: isDragging ? 0 : 0.9,
                  ease: "easeOut",
                  delay: isNew && !isDragging ? 0.15 : 0,
                },
                opacity: {
                  duration: 0.25,
                  ease: "easeOut",
                  delay: isNew && !isDragging ? 0.15 : 0,
                },
                scale: {
                  type: "spring",
                  stiffness: 520,
                  damping: 22,
                },
                filter: { duration: 0.12 },
              }}
              drag
              dragMomentum={false}
              dragConstraints={treeItemsContainerRef}
              dragElastic={0}
              onDragStart={() => onDragStart(id)}
              onDragEnd={(event, info) => onDragEnd(id, m, event, info)}
              className="absolute cursor-grab active:cursor-grabbing select-none"
              style={{
                left: `${leftPct}%`,
                top:
                  type === "ornament" && topPct !== undefined
                    ? `${topPct}%`
                    : undefined,
                bottom:
                  type === "gift" && bottomPct !== undefined
                    ? `${bottomPct}%`
                    : undefined,
                width: p?.size ?? (type === "gift" ? 34 : 24),
                height: p?.size ?? (type === "gift" ? 34 : 24),
                transform:
                  type === "gift"
                    ? "translate(-50%, 0)"
                    : "translate(-50%, -50%)",
                zIndex: isDragging || hoveredItemId === id ? 999 : 20,
              }}
              title={`${m.sender_name}: ${m.content}`}
              onClick={(e) => {
                // 드래그 중이면 클릭 이벤트 무시
                if (isDragging) {
                  e.stopPropagation();
                  return;
                }
                // ✅ 오너먼트는 언제든 열람 가능, 선물만 타임락
                // Hydration Error 방지: 마운트 후에만 체크
                if (type === "gift" && isMounted && !isGiftUnlocked) {
                  return;
                }
                onItemClick(m);
              }}
              onHoverStart={() => {
                if (!isDragging) onItemHoverStart(id);
              }}
              onHoverEnd={() => {
                if (!isDragging) onItemHoverEnd();
              }}
              whileHover={
                !isDragging
                  ? {
                      scale: 1.2,
                      filter: "brightness(1.1)",
                    }
                  : undefined
              }
              whileTap={!isDragging ? { scale: 0.98 } : undefined}
            >
              <Image
                src={src}
                alt={type === "gift" ? "gift" : "ornament"}
                fill
                sizes="32px"
                loading="lazy"
                className="object-contain drop-shadow-[2px_4px_6px_rgba(0,0,0,0.25)] pointer-events-none"
              />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
