# X-mas (Claymorphism Christmas Rolling Paper)

Next.js 14 (App Router) + Tailwind CSS + Framer Motion 기반으로 **클레이모피즘/글래스모피즘** UI 뼈대를 만든 프로젝트입니다.

## 실행 방법

```bash
npm install
npm run dev
```

## 프로젝트 구조

```
app/
  ├── page.tsx              # 랜딩/브릿지 페이지 (온보딩)
  ├── dashboard/            # 내 트리 목록 대시보드
  ├── tree/[id]/           # 개별 트리 페이지 (동적 라우트)
  ├── auth/callback/        # OAuth 콜백 핸들러
  └── api/                  # API 라우트
    ├── santa/              # 산타 분석 API
    └── admin/              # 관리자 API

components/
  ├── tree/                 # 트리 관련 컴포넌트
  │   ├── TreeView.tsx      # 트리 렌더링 (공통)
  │   ├── OwnerView.tsx     # 오너 모드 UI
  │   └── GuestView.tsx     # 게스트 모드 UI
  ├── GlobalNavBar.tsx      # 전역 네비게이션 바
  ├── MessageModal.tsx      # 메시지 작성 모달
  ├── UnboxModal.tsx        # 메시지 열람 모달
  ├── OnboardingModal.tsx   # 온보딩 모달
  ├── SantaAnalysisModal.tsx # 산타 분석 모달
  └── ...
```

## URL 구조

- `/` - 랜딩/브릿지 페이지 (비로그인: 온보딩, 로그인: 대시보드로 리다이렉트)
- `/dashboard` - 내 트리 목록 페이지
- `/tree/[id]` - 개별 트리 페이지 (오너/게스트 모드 자동 구분)

## 주요 기능

- **오너 모드**: 트리 공유, 수정, 산타 편지 확인
- **게스트 모드**: 오너먼트 달기, 선물 주기
- **대시보드**: 내가 만든 모든 트리 목록 관리

## 필요한 이미지 파일

### 트리 이미지

- `public/images/tree1.png`
- `public/images/tree2.png`
- `public/images/tree3.png`

### 오너먼트 이미지

- `public/images/ornament-1.png` ~ `ornament-6.png`

### 선물 이미지

- `public/images/gift-red.png`
- `public/images/gift-green.png`
- `public/images/gift-yellow.png`

### 기타

- `public/images/santa.png`
