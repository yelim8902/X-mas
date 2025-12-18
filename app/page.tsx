"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/utils/supabase";
import {
  OnboardingModal,
  type HostProfile,
} from "@/components/OnboardingModal";
import { LoginModal } from "@/components/LoginModal";
import { Toast } from "@/components/Toast";
import { getTreePath, getDashboardPath } from "@/utils/url";

export default function LandingPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // 디버깅: isLoginModalOpen 상태 변경 추적
  useEffect(() => {
    console.log("[DEBUG] isLoginModalOpen changed:", isLoginModalOpen);
  }, [isLoginModalOpen]);
  const [pendingTreeData, setPendingTreeData] = useState<{
    profile: HostProfile;
    treeId: string;
  } | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string }>({
    open: false,
    message: "",
  });

  const showToast = useCallback((message: string) => {
    setToast({ open: true, message });
    window.setTimeout(() => setToast((t) => ({ ...t, open: false })), 2200);
  }, []);

  // 새 트리 만들기: localStorage 정리 후 완전 새로고침 (온보딩 모달 자동 열기)
  const handleCreateNewTree = useCallback(() => {
    if (typeof window !== "undefined") {
      // localStorage 완전 정리
      window.localStorage.removeItem("my_tree_id");
      window.localStorage.removeItem("xmas.hostProfile");
      window.localStorage.removeItem("xmas.pendingTreeData");
      // create 파라미터와 함께 완전 새로고침하여 온보딩 모달이 바로 뜨게 함
      window.location.href = "/?create=true";
    }
  }, []);

  useEffect(() => {
    // localStorage에서 pendingTreeData 복원 (OAuth 콜백 후)
    const savedPendingTreeData =
      typeof window !== "undefined"
        ? window.localStorage.getItem("xmas.pendingTreeData")
        : null;
    if (savedPendingTreeData) {
      try {
        const parsed = JSON.parse(savedPendingTreeData);
        setPendingTreeData(parsed);
        window.localStorage.removeItem("xmas.pendingTreeData");
      } catch (e) {
        console.error("pendingTreeData 복원 실패:", e);
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 기존 URL 형식 지원: ?tree=xxx 쿼리 파라미터를 /tree/[id]로 리다이렉트
  useEffect(() => {
    if (isLoading) return;

    const urlParams = new URLSearchParams(window.location.search);
    const treeParam = urlParams.get("tree");
    const createParam = urlParams.get("create");

    // ?tree=xxx 형식의 기존 링크를 새 URL 구조로 리다이렉트
    if (treeParam) {
      router.replace(getTreePath(treeParam));
      return;
    }

    // ?create=true 파라미터가 있으면 바로 온보딩 모달 열기
    // 단, "이미 트리를 만들었어요!" 플로우가 아니면 (viewExistingTree 플래그가 없으면)
    const viewExistingTree =
      typeof window !== "undefined"
        ? window.localStorage.getItem("xmas.viewExistingTree") === "true"
        : false;

    if (createParam === "true" && !viewExistingTree) {
      setIsOnboardingOpen(true);
      // URL에서 create 파라미터 제거
      urlParams.delete("create");
      const newUrl = urlParams.toString()
        ? `${window.location.pathname}?${urlParams.toString()}`
        : window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    } else if (createParam === "true" && viewExistingTree) {
      // viewExistingTree 플래그가 있으면 create 파라미터만 제거하고 온보딩 모달은 열지 않음
      urlParams.delete("create");
      const newUrl = urlParams.toString()
        ? `${window.location.pathname}?${urlParams.toString()}`
        : window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [isLoading, router]);

  // 로그인한 사용자가 루트로 접속하면 대시보드로 리다이렉트 (단, OAuth 콜백이나 redirect_to가 있을 때만)
  useEffect(() => {
    if (!isLoading && user?.id && !pendingTreeData) {
      // OAuth 콜백에서 login_success 파라미터 확인
      const urlParams = new URLSearchParams(window.location.search);
      const loginSuccess = urlParams.get("login_success");
      const redirectTo = urlParams.get("redirect_to");
      const treeParam = urlParams.get("tree");

      // tree 파라미터가 있으면 이미 위에서 처리됨
      if (treeParam) return;

      // "이미 트리를 만들었어요!" 플로우 확인
      const viewExistingTree =
        typeof window !== "undefined"
          ? window.localStorage.getItem("xmas.viewExistingTree") === "true"
          : false;

      // OAuth 콜백이거나 redirect_to가 있을 때만 자동 리다이렉트
      if (loginSuccess === "true") {
        showToast("로그인이 완료되었어요!");
        // URL에서 login_success 파라미터 제거하고 리다이렉트
        if (redirectTo) {
          router.replace(redirectTo);
        } else if (viewExistingTree) {
          // "이미 트리를 만들었어요!" 플로우면 대시보드로
          if (typeof window !== "undefined") {
            window.localStorage.removeItem("xmas.viewExistingTree");
          }
          router.replace(getDashboardPath());
        } else {
          router.replace(getDashboardPath());
        }
      } else if (redirectTo) {
        // redirect_to가 있으면 해당 경로로 이동
        router.push(redirectTo);
      } else if (viewExistingTree) {
        // "이미 트리를 만들었어요!" 플로우면 대시보드로
        if (typeof window !== "undefined") {
          window.localStorage.removeItem("xmas.viewExistingTree");
        }
        router.push(getDashboardPath());
      }
      // redirect_to가 없고 viewExistingTree도 아니면 랜딩 페이지에 머물러서 새 트리 만들기 가능
    }
  }, [isLoading, user, pendingTreeData, router, showToast]);

  // 로그인 성공 시 대기 중인 트리 데이터 저장
  useEffect(() => {
    if (user && pendingTreeData) {
      void (async () => {
        try {
          const { error } = await supabase.from("trees").upsert(
            {
              id: pendingTreeData.treeId,
              host_name: pendingTreeData.profile.name,
              host_gender: pendingTreeData.profile.gender,
              host_age: pendingTreeData.profile.age,
              tree_style: pendingTreeData.profile.treeStyle,
              user_id: user.id,
            },
            { onConflict: "id" }
          );

          if (error) {
            console.error("트리 정보 저장 실패:", error);
            showToast("트리 저장에 실패했어요. 다시 시도해주세요.");
            setPendingTreeData(null);
            return;
          }

          // 성공 시 트리 페이지로 이동
          showToast("트리가 저장되었어요! 친구들에게 공유해보세요.");
          router.push(getTreePath(pendingTreeData.treeId));
          setPendingTreeData(null);
        } catch (e) {
          console.error("트리 정보 저장 중 오류:", e);
          showToast("트리 저장에 실패했어요. 다시 시도해주세요.");
          setPendingTreeData(null);
        }
      })();
      return;
    }

    // pendingTreeData가 없고 사용자가 로그인되었고 로그인 모달이 열려있었다면 대시보드로 이동
    // ⚠️ user가 있을 때만 실행 (로그인 안 된 사용자는 로그인 모달을 열어야 하므로)
    if (user?.id && isLoginModalOpen && !pendingTreeData) {
      const urlParams = new URLSearchParams(window.location.search);
      const loginSuccess = urlParams.get("login_success");

      // OAuth 콜백이 아닌 경우에만 대시보드로 이동
      if (!loginSuccess) {
        console.log(
          "[DEBUG] User logged in, closing login modal and redirecting to dashboard"
        );
        setIsLoginModalOpen(false);
        router.push(getDashboardPath());
      }
    }
  }, [user, pendingTreeData, router, isLoginModalOpen, showToast]);

  // 로딩 중
  if (isLoading) {
    return (
      <main className="relative flex min-h-dvh items-center justify-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-skyPastel-50 via-skyPastel-100 to-skyPastel-200" />
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-christmas-red border-t-transparent" />
      </main>
    );
  }

  // 랜딩 페이지: 로그인 여부와 관계없이 온보딩 화면 표시
  return (
    <main className="relative min-h-dvh overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-skyPastel-50 via-skyPastel-100 to-skyPastel-200" />
      <div className="relative mx-auto flex min-h-dvh max-w-5xl flex-col items-center justify-center px-5 pb-10 pt-6 sm:px-8 sm:pt-10">
        <div className="flex flex-col items-center gap-6">
          <h1 className="text-3xl font-extrabold text-slate-700 sm:text-4xl">
            크리스마스 트리 만들기
          </h1>
          <p className="text-center text-lg text-slate-600">
            친구들과 함께 나만의 크리스마스 트리를 꾸며보세요
          </p>
          <motion.button
            type="button"
            onClick={() => setIsOnboardingOpen(true)}
            whileHover={{ y: -2 }}
            whileTap={{ y: 0, scale: 0.98 }}
            className="rounded-2xl bg-christmas-green px-8 py-4 text-lg font-extrabold text-white shadow-lg transition-shadow hover:shadow-xl"
          >
            트리 만들기 시작하기
          </motion.button>
        </div>
      </div>

      <OnboardingModal
        open={isOnboardingOpen}
        initial={
          user?.user_metadata?.full_name
            ? {
                name: user.user_metadata.full_name,
                gender: "other" as const,
                age: 20,
                treeStyle: "tree1.png",
              }
            : undefined
        }
        availableTreeStyles={[
          {
            key: "tree1.png",
            label: "트리 1",
            previewSrc: "/images/tree1.png",
          },
          {
            key: "tree2.png",
            label: "트리 2",
            previewSrc: "/images/tree2.png",
          },
          {
            key: "tree3.png",
            label: "트리 3",
            previewSrc: "/images/tree3.png",
          },
        ]}
        hasExistingTree={true}
        onViewExistingTree={() => {
          console.log("[DEBUG] onViewExistingTree called", { user: user?.id });
          // localStorage의 my_tree_id를 제거하여 로그인 후 대시보드로 리다이렉트되도록 함
          if (typeof window !== "undefined") {
            window.localStorage.removeItem("my_tree_id");
            // "이미 트리를 만들었어요!" 플로우임을 표시 (로그인 후 대시보드로 가기 위함)
            window.localStorage.setItem("xmas.viewExistingTree", "true");
          }

          // 로그인된 사용자면 바로 대시보드로 이동
          if (user?.id) {
            console.log(
              "[DEBUG] User already logged in, redirecting to dashboard"
            );
            setIsOnboardingOpen(false);
            if (typeof window !== "undefined") {
              window.localStorage.removeItem("xmas.viewExistingTree");
            }
            router.push(getDashboardPath());
          } else {
            // 로그인 안 된 사용자면 로그인 모달 열기 (LoginModal에서 redirect_to를 /dashboard로 설정)
            console.log("[DEBUG] User not logged in, opening login modal");
            // 온보딩 모달을 먼저 닫고, 약간의 지연 후 로그인 모달 열기 (상태 업데이트 충돌 방지)
            setIsOnboardingOpen(false);
            setTimeout(() => {
              console.log("[DEBUG] Setting isLoginModalOpen to true");
              setIsLoginModalOpen(true);
            }, 100);
          }
        }}
        onComplete={async (profile) => {
          // 항상 새로운 트리 ID 생성 (다중 트리 지원)
          const treeId =
            typeof crypto !== "undefined" && "randomUUID" in crypto
              ? crypto.randomUUID()
              : String(Date.now());

          // 로그인 상태 확인
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (session?.user) {
            // 로그인되어 있으면 바로 저장하고 트리 페이지로 이동
            setIsOnboardingOpen(false); // 모달 닫기
            setIsLoading(true); // 로딩 스피너 표시

            try {
              const { error } = await supabase.from("trees").upsert(
                {
                  id: treeId,
                  host_name: profile.name,
                  host_gender: profile.gender,
                  host_age: profile.age,
                  tree_style: profile.treeStyle,
                  user_id: session.user.id,
                },
                { onConflict: "id" }
              );

              if (error) throw error;

              // localStorage에 새 트리 ID 저장 (선택적)
              if (typeof window !== "undefined") {
                window.localStorage.setItem("my_tree_id", treeId);
              }

              showToast("트리가 생성되었어요! 친구들에게 공유해보세요.");
              // 새 트리 페이지로 자동 이동
              router.push(getTreePath(treeId));
            } catch (e) {
              console.error("트리 저장 실패:", e);
              showToast("트리 저장에 실패했어요. 다시 시도해주세요.");
              setIsLoading(false);
            }
          } else {
            // 로그인 필요: pendingTreeData 저장
            const pendingData = { profile, treeId };
            setPendingTreeData(pendingData);
            if (typeof window !== "undefined") {
              window.localStorage.setItem(
                "xmas.pendingTreeData",
                JSON.stringify(pendingData)
              );
            }
            setIsOnboardingOpen(false);
            setIsLoginModalOpen(true);
          }
        }}
        onClose={() => setIsOnboardingOpen(false)}
      />

      <LoginModal
        open={isLoginModalOpen}
        canClose={!pendingTreeData}
        onClose={() => {
          console.log("[DEBUG] LoginModal onClose called");
          setIsLoginModalOpen(false);
        }}
        onSuccess={() => {
          console.log("[DEBUG] LoginModal onSuccess called");
          // 로그인 성공 시 OAuth 콜백을 통해 자동으로 리다이렉트됨
          // redirect_to 파라미터가 /dashboard로 설정되어 있음 (my_tree_id가 없으면)
          setIsLoginModalOpen(false);
        }}
        message={
          pendingTreeData
            ? "나중에 다시 수정하거나 친구들의 메시지를 확인하려면 로그인이 필요해요!"
            : "트리를 관리하려면 로그인이 필요해요!"
        }
      />

      {/* 디버깅용: 로그인 모달 상태 확인 */}
      {process.env.NODE_ENV === "development" && (
        <div className="fixed bottom-4 left-4 bg-black/80 text-white p-2 text-xs rounded z-[9999]">
          isLoginModalOpen: {String(isLoginModalOpen)}
        </div>
      )}

      <Toast open={toast.open} message={toast.message} />
    </main>
  );
}
