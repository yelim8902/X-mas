"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/utils/supabase";
import { getTreePath } from "@/utils/url";
import { GlobalNavBar } from "@/components/GlobalNavBar";

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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
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
    // localStorage 완전 정리 후 완전 새로고침
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("my_tree_id");
      window.localStorage.removeItem("xmas.hostProfile");
      window.localStorage.removeItem("xmas.pendingTreeData");
      // 완전 새로고침하여 온보딩 모달이 뜨게 함
      window.location.href = "/";
    }
  };

  if (!user) {
    return (
      <main className="relative min-h-dvh overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-skyPastel-50 via-skyPastel-100 to-skyPastel-200" />
        <div className="relative mx-auto flex min-h-dvh max-w-5xl flex-col items-center justify-center px-5 pb-10 pt-6 sm:px-8 sm:pt-10">
          <div className="flex flex-col items-center gap-4">
            <p className="text-lg font-bold text-slate-700">
              로그인이 필요해요
            </p>
            <motion.button
              type="button"
              onClick={handleCreateTree}
              whileHover={{ y: -1 }}
              whileTap={{ y: 1, scale: 0.98 }}
              className="rounded-2xl bg-christmas-green px-6 py-3 text-base font-extrabold text-white shadow-sm"
            >
              로그인하고 트리 만들기
            </motion.button>
          </div>
        </div>
      </main>
    );
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
              <motion.button
                key={tree.id}
                type="button"
                onClick={() => handleSelectTree(tree.id)}
                whileHover={{ y: -2 }}
                whileTap={{ y: 0, scale: 0.98 }}
                className="group relative overflow-hidden rounded-3xl border border-white/40 bg-white/30 p-6 text-left shadow-[0_20px_50px_rgba(25,50,80,0.12)] backdrop-blur-xl transition-all hover:bg-white/40"
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
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
