"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/utils/supabase";
import { getTreePath } from "@/utils/url";
import { GlobalNavBar } from "@/components/GlobalNavBar";
import { ConfirmModal } from "@/components/ConfirmModal";

type TreeItem = {
  id: string;
  host_name: string;
  host_gender: string;
  host_age: number;
  tree_style: string;
  created_at: string;
  updated_at: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [trees, setTrees] = useState<TreeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [treeToDelete, setTreeToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 로그인 안 된 사용자는 랜딩 페이지로 리다이렉트
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/");
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const loadTrees = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from("trees")
          .select("*")
          .eq("user_id", user.id)
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
  }, [user?.id]);

  const handleSelectTree = (treeId: string) => {
    router.push(getTreePath(treeId));
  };

  const handleCreateTree = () => {
    // localStorage 완전 정리 후 완전 새로고침 (온보딩 모달 자동 열기)
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("my_tree_id");
      window.localStorage.removeItem("xmas.hostProfile");
      window.localStorage.removeItem("xmas.pendingTreeData");
      // create 파라미터와 함께 완전 새로고침하여 온보딩 모달이 바로 뜨게 함
      window.location.href = "/?create=true";
    }
  };

  const handleDeleteTree = async (treeId: string) => {
    if (isDeleting) return;

    setIsDeleting(true);
    try {
      // 1. 먼저 관련 메시지들 삭제 (트리 삭제 전에)
      const { error: messagesDeleteError } = await supabase
        .from("messages")
        .delete()
        .eq("tree_id", treeId);

      if (messagesDeleteError) {
        console.error("메시지 삭제 실패:", messagesDeleteError);
        // 메시지 삭제 실패해도 트리 삭제는 계속 진행
      }

      // 2. 트리 삭제
      const { error: deleteError } = await supabase
        .from("trees")
        .delete()
        .eq("id", treeId)
        .eq("user_id", user?.id); // 본인의 트리만 삭제 가능

      if (deleteError) {
        console.error("트리 삭제 실패:", deleteError);
        setError("트리 삭제에 실패했어요.");
        setIsDeleting(false);
        setTreeToDelete(null);
        return;
      }

      // 3. 로컬 상태에서도 삭제
      setTrees((prev) => prev.filter((tree) => tree.id !== treeId));

      // 4. localStorage에서도 제거 (현재 선택된 트리인 경우)
      if (typeof window !== "undefined") {
        const currentTreeId = window.localStorage.getItem("my_tree_id");
        if (currentTreeId === treeId) {
          window.localStorage.removeItem("my_tree_id");
        }
        // 트리 관련 localStorage 데이터도 정리
        window.localStorage.removeItem(`xmas.santaResult:${treeId}`);
      }

      setTreeToDelete(null);
    } catch (e) {
      console.error("트리 삭제 중 오류:", e);
      setError("트리 삭제에 실패했어요.");
    } finally {
      setIsDeleting(false);
    }
  };

  // 로그인 안 된 사용자는 랜딩 페이지로 리다이렉트
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/");
    }
  }, [isLoading, user, router]);

  if (!user) {
    // 로딩 중이거나 리다이렉트 대기 중
    return null;
  }

  return (
    <main className="relative min-h-dvh overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-skyPastel-50 via-skyPastel-100 to-skyPastel-200" />
      <div className="relative mx-auto flex min-h-dvh max-w-5xl flex-col px-5 pb-10 pt-6 sm:px-8 sm:pt-10">
        <GlobalNavBar user={user} isOwner={false} />

        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-extrabold text-slate-700">
            내 트리 목록
          </h1>
          <motion.button
            type="button"
            onClick={handleCreateTree}
            whileHover={{ y: -1 }}
            whileTap={{ y: 1, scale: 0.98 }}
            className="rounded-2xl bg-christmas-green px-4 py-2 text-sm font-extrabold text-white shadow-sm"
          >
            새 트리 만들기
          </motion.button>
        </div>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-christmas-red border-t-transparent" />
          </div>
        ) : error ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm font-bold text-christmas-red">{error}</p>
          </div>
        ) : trees.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <p className="text-lg font-bold text-slate-700">
              아직 만든 트리가 없어요
            </p>
            <motion.button
              type="button"
              onClick={handleCreateTree}
              whileHover={{ y: -1 }}
              whileTap={{ y: 1, scale: 0.98 }}
              className="rounded-2xl bg-christmas-green px-6 py-3 text-base font-extrabold text-white shadow-sm"
            >
              첫 트리 만들기
            </motion.button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trees.map((tree) => (
              <motion.div
                key={tree.id}
                whileHover={{ y: -2 }}
                className="group relative overflow-hidden rounded-3xl border border-white/40 bg-white/30 p-6 text-left shadow-[0_20px_50px_rgba(25,50,80,0.12)] backdrop-blur-xl transition-all hover:bg-white/40"
              >
                <button
                  type="button"
                  onClick={() => handleSelectTree(tree.id)}
                  className="w-full text-left"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-lg font-extrabold text-slate-700">
                      {tree.host_name}님의 트리
                    </h2>
                    <div className="h-2 w-2 rounded-full bg-christmas-green" />
                  </div>
                  <p className="mb-2 text-sm text-slate-600">
                    {tree.host_gender === "female"
                      ? "여성"
                      : tree.host_gender === "male"
                      ? "남성"
                      : "비공개"}{" "}
                    · {tree.host_age}살
                  </p>
                  <p className="text-xs text-slate-500">
                    생성일:{" "}
                    {new Date(tree.created_at).toLocaleDateString("ko-KR")}
                  </p>
                  {tree.updated_at !== tree.created_at && (
                    <p className="mt-1 text-xs text-slate-500">
                      수정일:{" "}
                      {new Date(tree.updated_at).toLocaleDateString("ko-KR")}
                    </p>
                  )}
                </button>

                {/* 삭제 버튼 */}
                <motion.button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setTreeToDelete(tree.id);
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="absolute right-4 top-4 rounded-full bg-christmas-red/10 p-2 text-christmas-red opacity-0 transition-opacity hover:bg-christmas-red/20 group-hover:opacity-100"
                  aria-label="트리 삭제"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </motion.button>
              </motion.div>
            ))}
          </div>
        )}

        {/* 트리 삭제 확인 모달 */}
        <ConfirmModal
          open={treeToDelete !== null}
          title="트리를 삭제할까요?"
          description={`${
            trees.find((t) => t.id === treeToDelete)?.host_name || ""
          }님의 트리가 영구적으로 삭제됩니다. (되돌릴 수 없음)`}
          confirmText={isDeleting ? "삭제 중..." : "삭제"}
          cancelText="취소"
          danger
          onCancel={() => {
            if (!isDeleting) setTreeToDelete(null);
          }}
          onConfirm={() => {
            if (treeToDelete && !isDeleting) {
              void handleDeleteTree(treeToDelete);
            }
          }}
        />
      </div>
    </main>
  );
}
