"use client";

import { motion } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";

type Props = {
  user: any;
  isOwner: boolean;
  hostName?: string | null;
  treeId?: string | null;
};

export function GlobalNavBar({ user, isOwner, hostName, treeId }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 루트 경로나 대시보드에서는 표시하지 않음
  if (pathname === "/" || pathname === "/dashboard" || !isMounted) {
    return null;
  }

  const handleGoToDashboard = () => {
    router.push("/dashboard");
  };

  const handleGoToMyTree = () => {
    if (user?.id) {
      router.push("/dashboard");
    } else {
      router.push("/");
    }
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-white/20 bg-white/60 backdrop-blur-md shadow-sm"
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3 sm:px-8">
        {/* 왼쪽: 상태 표시 */}
        <div className="flex items-center gap-3">
          {user ? (
            isOwner ? (
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-christmas-green" />
                <span className="text-sm font-bold text-slate-700">
                  내 트리 관리 중
                </span>
                {hostName && (
                  <span className="text-xs text-slate-500">
                    ({hostName}님의 트리)
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-slate-400" />
                <span className="text-sm font-bold text-slate-700">
                  {hostName ? `${hostName}님의 트리를 구경 중` : "게스트 모드"}
                </span>
              </div>
            )
          ) : (
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-slate-300" />
              <span className="text-sm font-bold text-slate-600">
                게스트 모드
              </span>
            </div>
          )}
        </div>

        {/* 오른쪽: 액션 버튼 */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {isOwner ? (
                <motion.button
                  type="button"
                  onClick={handleGoToDashboard}
                  whileHover={{ y: -1 }}
                  whileTap={{ y: 1, scale: 0.98 }}
                  className="rounded-xl bg-white/80 px-4 py-2 text-xs font-extrabold text-slate-700 shadow-sm ring-1 ring-white/45 backdrop-blur-sm transition-colors hover:bg-white/90"
                >
                  내 트리 목록
                </motion.button>
              ) : (
                <motion.button
                  type="button"
                  onClick={handleGoToMyTree}
                  whileHover={{ y: -1 }}
                  whileTap={{ y: 1, scale: 0.98 }}
                  className="rounded-xl bg-christmas-green/90 px-4 py-2 text-xs font-extrabold text-white shadow-sm ring-1 ring-christmas-green/30 backdrop-blur-sm transition-colors hover:bg-christmas-green"
                >
                  내 트리로 가기
                </motion.button>
              )}
            </>
          ) : (
            <motion.button
              type="button"
              onClick={() => {
                // localStorage 완전 정리 후 완전 새로고침 (온보딩 모달 자동 열기)
                if (typeof window !== "undefined") {
                  window.localStorage.removeItem("my_tree_id");
                  window.localStorage.removeItem("xmas.hostProfile");
                  window.localStorage.removeItem("xmas.pendingTreeData");
                  // create 파라미터와 함께 완전 새로고침하여 온보딩 모달이 바로 뜨게 함
                  window.location.href = "/?create=true";
                }
              }}
              whileHover={{ y: -1 }}
              whileTap={{ y: 1, scale: 0.98 }}
              className="rounded-xl bg-white/80 px-4 py-2 text-xs font-extrabold text-slate-700 shadow-sm ring-1 ring-white/45 backdrop-blur-sm transition-colors hover:bg-white/90"
            >
              나도 트리 만들기
            </motion.button>
          )}
        </div>
      </div>
    </motion.nav>
  );
}
