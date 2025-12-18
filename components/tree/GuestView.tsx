"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import type { ItemType, GiftColor } from "@/utils/supabase";

type Props = {
  hostName: string | null;
  onComposeOrnament: () => void;
  onComposeGift: () => void;
  onCreateTree: () => void;
};

export function GuestView({
  hostName,
  onComposeOrnament,
  onComposeGift,
  onCreateTree,
}: Props) {
  const router = useRouter();

  return (
    <>
      <div className="flex w-full max-w-md flex-col gap-3">
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:gap-4">
          <motion.button
            type="button"
            onClick={onComposeOrnament}
            disabled={!hostName}
            whileHover={{ y: -2 }}
            whileTap={{ y: 1, scale: 0.99 }}
            className={[
              "group relative w-full select-none rounded-clay px-6 py-4 text-lg font-extrabold tracking-tight text-white",
              "bg-gradient-to-b from-christmas-green to-[#239B62]",
              "shadow-clay shadow-clayInset ring-1 ring-white/35",
              "transition-[transform,box-shadow] duration-150 ease-out",
              "active:shadow-clayPressed active:translate-y-[1px]",
              !hostName ? "opacity-60" : "opacity-100",
            ].join(" ")}
          >
            <span className="pointer-events-none absolute inset-0 rounded-clay bg-gradient-to-b from-white/25 to-transparent opacity-70" />
            <span className="relative">오너먼트 달기</span>
          </motion.button>

          <motion.button
            type="button"
            onClick={onComposeGift}
            disabled={!hostName}
            whileHover={{ y: -2 }}
            whileTap={{ y: 1, scale: 0.99 }}
            className={[
              "group relative w-full select-none rounded-clay px-6 py-4 text-lg font-extrabold tracking-tight text-white",
              "bg-gradient-to-b from-christmas-red to-[#D73C3C]",
              "shadow-clay shadow-clayInset ring-1 ring-white/35",
              "transition-[transform,box-shadow] duration-150 ease-out",
              "active:shadow-clayPressed active:translate-y-[1px]",
              !hostName ? "opacity-60" : "opacity-100",
            ].join(" ")}
          >
            <span className="pointer-events-none absolute inset-0 rounded-clay bg-gradient-to-b from-white/25 to-transparent opacity-70" />
            <span className="relative">선물 주기</span>
            <span className="pointer-events-none absolute -right-2 -top-2 h-10 w-10 rounded-full bg-white/25 blur-xl" />
          </motion.button>
        </div>
      </div>

      {/* 나도 트리 만들기 버튼 */}
      <div className="mt-4 flex w-full max-w-md justify-center">
        <motion.button
          type="button"
          onClick={onCreateTree}
          whileHover={{ y: -1 }}
          whileTap={{ y: 1, scale: 0.98 }}
          className={[
            "group relative select-none rounded-2xl px-6 py-3 text-sm font-extrabold tracking-tight text-slate-700",
            "border border-white/45 bg-white/35 shadow-[inset_0_2px_0_rgba(255,255,255,0.55),_0_10px_18px_rgba(25,50,80,0.10)] ring-1 ring-white/45 backdrop-blur-md",
            "transition-[transform,box-shadow] duration-150 ease-out",
          ].join(" ")}
        >
          <span className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-white/25 to-transparent opacity-70" />
          <span className="relative">나도 트리 만들기</span>
        </motion.button>
      </div>
    </>
  );
}
