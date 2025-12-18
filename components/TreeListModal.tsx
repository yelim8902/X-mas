"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";

type TreeItem = {
  id: string;
  host_name: string;
  host_gender: string;
  host_age: number;
  tree_style: string;
  created_at: string;
  updated_at: string;
};

type Props = {
  open: boolean;
  userId: string;
  onClose: () => void;
  onSelectTree: (treeId: string) => void;
};

export function TreeListModal({ open, userId, onClose, onSelectTree }: Props) {
  const [trees, setTrees] = useState<TreeItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !userId) return;

    const loadTrees = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from("trees")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (fetchError) {
          setError("트리를 불러오는데 실패했어요.");
          console.error("트리 목록 로드 실패:", fetchError);
          return;
        }

        setTrees((data as TreeItem[]) || []);
      } catch (e) {
        setError("트리를 불러오는데 실패했어요.");
        console.error("트리 목록 로드 중 오류:", e);
      } finally {
        setIsLoading(false);
      }
    };

    void loadTrees();
  }, [open, userId]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}.${month}.${day} ${hours}:${minutes}`;
  };

  const getGenderText = (gender: string) => {
    switch (gender) {
      case "female":
        return "여성";
      case "male":
        return "남성";
      case "nonbinary":
        return "논바이너리";
      default:
        return "기타/비공개";
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[1200] flex items-center justify-center px-5 py-4 overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          aria-modal="true"
          role="dialog"
        >
          <div
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ y: 18, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 12, scale: 0.98, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="relative w-full max-w-2xl max-h-[calc(100vh-2rem)] overflow-y-auto rounded-[34px] border border-white/45 bg-white/35 p-4 sm:p-6 md:p-8 shadow-[0_30px_90px_rgba(25,50,80,0.22)] backdrop-blur-xl ring-1 ring-white/35 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pointer-events-none absolute inset-0 rounded-[34px] bg-gradient-to-b from-white/45 to-transparent opacity-70" />
            <div className="relative">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-800">
                    내 트리 목록
                  </p>
                  <p className="mt-1 text-xs sm:text-sm font-semibold text-slate-600">
                    만들었던 트리들을 확인하고 선택할 수 있어요.
                  </p>
                </div>
                <motion.button
                  type="button"
                  onClick={onClose}
                  whileTap={{ scale: 0.98 }}
                  className="rounded-full p-2 text-slate-600 transition-colors hover:bg-white/40 hover:text-slate-800"
                  aria-label="닫기"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </motion.button>
              </div>

              <div className="mt-6">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-slate-500 text-sm font-semibold">
                      트리를 불러오는 중...
                    </div>
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-red-500 text-sm font-semibold">
                      {error}
                    </div>
                  </div>
                ) : trees.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <p className="text-slate-500 text-sm font-semibold">
                      아직 만든 트리가 없어요.
                    </p>
                    <p className="mt-2 text-slate-400 text-xs">
                      트리를 만들어보세요!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {trees.map((tree) => (
                      <motion.button
                        key={tree.id}
                        type="button"
                        onClick={() => {
                          onSelectTree(tree.id);
                          onClose();
                        }}
                        whileHover={{ y: -2 }}
                        whileTap={{ y: 0, scale: 0.98 }}
                        className={[
                          "relative w-full text-left rounded-3xl border border-white/50 bg-white/45 p-4",
                          "shadow-[inset_0_2px_0_rgba(255,255,255,0.6),_0_12px_20px_rgba(25,50,80,0.12)]",
                          "ring-1 ring-white/35 transition-all duration-150 ease-out",
                          "hover:bg-white/60 hover:shadow-[inset_0_2px_0_rgba(255,255,255,0.7),_0_14px_24px_rgba(25,50,80,0.15)]",
                        ].join(" ")}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-base font-extrabold text-slate-800 truncate">
                                {tree.host_name}
                              </p>
                              <span className="text-xs font-semibold text-slate-500">
                                {getGenderText(tree.host_gender)} ·{" "}
                                {tree.host_age}살
                              </span>
                            </div>
                            <p className="text-xs text-slate-500">
                              생성일: {formatDate(tree.created_at)}
                            </p>
                            {tree.updated_at !== tree.created_at && (
                              <p className="text-xs text-slate-400 mt-0.5">
                                수정일: {formatDate(tree.updated_at)}
                              </p>
                            )}
                          </div>
                          <div className="flex-shrink-0">
                            <svg
                              className="h-5 w-5 text-slate-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
