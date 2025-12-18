"use client";

import { motion } from "framer-motion";
import type { MessageRow } from "@/utils/supabase";

type Props = {
  messages: MessageRow[];
  savedSanta: {
    summary: string;
    gift: string;
    raw?: string;
    createdAt: number;
    itemCount: number;
  } | null;
  onShare: () => void;
  onUpdate: () => void;
  onViewSanta: () => void;
  onRunSantaAnalysis: () => void;
  onEditTree: () => void;
};

export function OwnerView({
  messages,
  savedSanta,
  onShare,
  onUpdate,
  onViewSanta,
  onRunSantaAnalysis,
  onEditTree,
}: Props) {
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      {/* 링크 복사하기 버튼 */}
      <motion.button
        type="button"
        onClick={onShare}
        whileHover={{ y: -2 }}
        whileTap={{ y: 1, scale: 0.99 }}
        className={[
          "group relative w-full select-none rounded-clay px-6 py-4 text-lg font-extrabold tracking-tight text-white",
          "bg-gradient-to-b from-christmas-red to-[#D73C3C]",
          "shadow-clay shadow-clayInset ring-1 ring-white/35",
          "transition-[transform,box-shadow] duration-150 ease-out",
          "active:shadow-clayPressed active:translate-y-[1px]",
        ].join(" ")}
      >
        <span className="pointer-events-none absolute inset-0 rounded-clay bg-gradient-to-b from-white/25 to-transparent opacity-70" />
        <span className="relative">친구들에게 트리 꾸며달라하기</span>
        <span className="pointer-events-none absolute -right-2 -top-2 h-10 w-10 rounded-full bg-white/25 blur-xl" />
      </motion.button>

      {/* 트리 정보 수정 버튼 */}
      <motion.button
        type="button"
        onClick={onEditTree}
        whileHover={{ y: -1 }}
        whileTap={{ y: 1, scale: 0.98 }}
        className="rounded-2xl bg-white/35 px-4 py-2 text-sm font-extrabold text-slate-700 shadow-[inset_0_2px_0_rgba(255,255,255,0.55),_0_10px_18px_rgba(25,50,80,0.10)] ring-1 ring-white/45 backdrop-blur-md"
      >
        내 트리 정보 수정
      </motion.button>

      {/* 3단계 버튼 상태: 초기 / 완료 / 업데이트 */}
      {savedSanta ? (
        // 완료 상태 또는 업데이트 상태
        messages.length !== savedSanta.itemCount ? (
          // 업데이트 상태: 새 메시지 있음
          <motion.button
            type="button"
            onClick={() => {
              if (messages.length >= 5) onRunSantaAnalysis();
            }}
            disabled={messages.length < 5}
            whileHover={messages.length >= 5 ? { y: -1 } : undefined}
            whileTap={messages.length >= 5 ? { y: 1, scale: 0.99 } : undefined}
            className={[
              "relative w-full max-w-md select-none rounded-3xl px-6 py-3 text-base font-extrabold tracking-tight text-slate-800",
              "border border-white/45 bg-white/35 shadow-[inset_0_2px_0_rgba(255,255,255,0.55),_0_18px_30px_rgba(25,50,80,0.14)] backdrop-blur-xl ring-1 ring-white/35",
              messages.length >= 5 ? "opacity-100" : "opacity-60",
            ].join(" ")}
          >
            산타 편지 업데이트{" "}
            <span className="ml-1 inline-block rounded-full bg-christmas-red px-2 py-0.5 text-xs font-bold text-white">
              New!
            </span>
          </motion.button>
        ) : (
          // 완료 상태: 새 메시지 없음
          <motion.button
            type="button"
            onClick={onViewSanta}
            whileHover={{ y: -1 }}
            whileTap={{ y: 1, scale: 0.99 }}
            className={[
              "relative w-full max-w-md select-none rounded-3xl px-6 py-3 text-base font-extrabold tracking-tight text-slate-800",
              "border border-white/45 bg-white/35 shadow-[inset_0_2px_0_rgba(255,255,255,0.55),_0_18px_30px_rgba(25,50,80,0.14)] backdrop-blur-xl ring-1 ring-white/35",
            ].join(" ")}
          >
            산타 편지 다시 보기
          </motion.button>
        )
      ) : (
        // 초기 상태: 분석 안 함
        <motion.button
          type="button"
          disabled={messages.length < 5}
          onClick={() => onRunSantaAnalysis()}
          whileHover={messages.length >= 5 ? { y: -1 } : undefined}
          whileTap={messages.length >= 5 ? { y: 1, scale: 0.99 } : undefined}
          className={[
            "relative w-full max-w-md select-none rounded-3xl px-6 py-3 text-base font-extrabold tracking-tight text-slate-800",
            "border border-white/45 bg-white/35 shadow-[inset_0_2px_0_rgba(255,255,255,0.55),_0_18px_30px_rgba(25,50,80,0.14)] backdrop-blur-xl ring-1 ring-white/35",
            messages.length >= 5 ? "opacity-100" : "opacity-60",
          ].join(" ")}
        >
          산타에게 선물 받기
          <span className="ml-2 text-xs font-bold text-slate-600">
            ({messages.length}/5)
          </span>
        </motion.button>
      )}
    </div>
  );
}
