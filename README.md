# X-mas (Claymorphism Christmas Rolling Paper)

Next.js 14 (App Router) + Tailwind CSS + Framer Motion 기반으로 **클레이모피즘/글래스모피즘** UI로 만든 크리스마스 트리 롤링페이퍼 애플리케이션입니다.

친구들과 함께 나만의 크리스마스 트리를 만들고, 오너먼트와 선물을 통해 따뜻한 메시지를 주고받을 수 있습니다.

## 🌟 주요 기능

### 트리 관리

- ✅ **다중 트리 지원**: 한 계정으로 여러 개의 트리를 만들고 관리
- ✅ **트리 삭제**: 대시보드에서 트리 삭제 기능
- ✅ **트리 수정**: 오너는 트리 정보(이름, 성별, 나이, 트리 스타일) 수정 가능

### 오너 모드

- 📤 **트리 공유**: 카카오톡으로 트리 링크 공유
- ✏️ **트리 정보 수정**: 온보딩 모달을 통해 트리 정보 변경
- 🎅 **산타 분석**: AI(Gemini)를 활용한 친구들의 메시지 분석 및 선물 추천
- 👀 **메시지 확인**: D-Day 이전에도 선물/오너먼트 메시지 확인 가능

### 게스트 모드

- 🎄 **오너먼트 달기**: 카테고리별(감사, 추억, 칭찬, 힘내, 위로, 소원) 질문에 답하며 메시지 작성
- 🎁 **선물 주기**: 빨간/초록/노란 선물 중 선택하여 메시지 전달
- 📦 **선물 열기**: D-Day에 선물을 열어 메시지 확인

### 인증 및 사용자 관리

- 🔐 **카카오 OAuth 로그인**: 간편한 소셜 로그인
- 📋 **대시보드**: 내가 만든 모든 트리 목록 확인 및 관리
- 🔄 **자동 리다이렉트**: 로그인 상태에 따라 자동 페이지 이동

## 🚀 실행 방법

### 환경 변수 설정

`.env.local` 파일을 생성하고 다음 변수들을 설정하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_PRODUCTION_URL=https://your-production-url.vercel.app
```

### 설치 및 실행

```bash
npm install
npm run dev
```

http://localhost:3000 에서 확인할 수 있습니다.

## 📁 프로젝트 구조

```
app/
  ├── page.tsx              # 랜딩/브릿지 페이지 (온보딩, 로그인 처리)
  ├── dashboard/            # 내 트리 목록 대시보드
  │   └── page.tsx          # 트리 목록 및 삭제 기능
  ├── tree/[id]/           # 개별 트리 페이지 (동적 라우트)
  │   └── page.tsx          # 오너/게스트 모드 자동 구분
  ├── auth/callback/        # OAuth 콜백 핸들러
  │   └── route.ts          # 카카오 로그인 후 리다이렉트 처리
  └── api/                  # API 라우트
      ├── santa/            # 산타 분석 API (Gemini AI)
      │   └── route.ts
      └── admin/            # 관리자 API
          └── reset-messages/route.ts

components/
  ├── tree/                 # 트리 관련 컴포넌트
  │   ├── TreeView.tsx      # 트리 렌더링 (공통)
  │   ├── OwnerView.tsx     # 오너 모드 UI
  │   └── GuestView.tsx     # 게스트 모드 UI
  ├── GlobalNavBar.tsx      # 전역 네비게이션 바
  ├── MessageModal.tsx      # 메시지 작성 모달
  ├── UnboxModal.tsx        # 메시지 열람 모달
  ├── OnboardingModal.tsx   # 온보딩 모달 (트리 생성/수정)
  ├── LoginModal.tsx        # 카카오 로그인 모달
  ├── SantaAnalysisModal.tsx # 산타 분석 모달
  ├── ConfirmModal.tsx      # 확인 모달 (삭제 등)
  ├── ShareCard.tsx         # 트리 공유 카드 (이미지 생성)
  └── Toast.tsx             # 토스트 알림

utils/
  ├── supabase.ts           # Supabase 클라이언트
  ├── url.ts                # URL 유틸리티 함수
  ├── ornamentQuestions.ts  # 오너먼트 카테고리별 질문 템플릿
  └── itemAssets.ts         # 아이템 이미지 경로 매핑
```

## 🔗 URL 구조

- `/` - 랜딩/브릿지 페이지
  - 비로그인: 온보딩 모달 표시 ("트리 만들기 시작하기")
  - 로그인: 자동으로 `/dashboard`로 리다이렉트
  - `?create=true` 파라미터: 온보딩 모달 자동 열기
- `/dashboard` - 내 트리 목록 페이지
  - 로그인 필요
  - 내가 만든 모든 트리 목록 표시
  - 트리 클릭 시 해당 트리 페이지로 이동
  - 트리 삭제 기능 (hover 시 삭제 버튼 표시)
- `/tree/[id]` - 개별 트리 페이지
  - 오너/게스트 모드 자동 구분 (접속한 사용자의 `user_id`와 트리의 `user_id` 비교)
  - 오너 모드: 공유하기, 수정하기, 산타 분석 등 관리 기능
  - 게스트 모드: 오너먼트 달기, 선물 주기 기능

## 🎨 필요한 이미지 파일

### 트리 이미지

- `public/images/tree1.png`
- `public/images/tree2.png`
- `public/images/tree3.png`

### 오너먼트 이미지

- `public/images/ornament-1.png`
- `public/images/ornament-2.png`
- `public/images/ornament-3.png`
- `public/images/ornament-4.png`
- `public/images/ornament-5.png`
- `public/images/ornament-6.png`

### 선물 이미지

- `public/images/gift-red.png`
- `public/images/gift-green.png`
- `public/images/gift-yellow.png`

### 기타

- `public/images/santa.png`

## 🛠 기술 스택

- **프레임워크**: Next.js 14 (App Router)
- **언어**: TypeScript
- **스타일링**: Tailwind CSS
- **애니메이션**: Framer Motion
- **인증**: Supabase Auth (카카오 OAuth)
- **데이터베이스**: Supabase (PostgreSQL)
- **AI**: Google Gemini API
- **이미지 생성**: html2canvas
- **배포**: Vercel

## 📝 데이터베이스 스키마

### trees 테이블

```sql
id (text, PK)
host_name (text)
host_gender (text) -- 'female' | 'male' | 'nonbinary' | 'other'
host_age (integer)
tree_style (text) -- 'tree1.png' | 'tree2.png' | 'tree3.png'
user_id (uuid, FK -> auth.users)
created_at (timestamptz)
updated_at (timestamptz)
```

### messages 테이블

```sql
id (uuid, PK)
tree_id (text, FK -> trees.id)
content (text)
item_type (text) -- 'ornament' | 'gift'
item_design (text)
question_category (text) -- 'gratitude' | 'memory' | 'compliment' | 'strength' | 'cheerup' | 'wish'
gift_color (text) -- 'red' | 'green' | 'yellow'
x (float)
y (float)
is_read (boolean)
created_at (timestamptz)
```

## 🔐 OAuth 설정

### Supabase 설정

1. Supabase Dashboard → Authentication → URL Configuration
2. Redirect URLs에 다음 추가:
   - `https://your-production-url.vercel.app/auth/callback`
   - `http://localhost:3000/auth/callback` (로컬 개발용)

### 카카오 개발자 센터

1. 카카오 로그인 활성화
2. Redirect URI 등록:
   - `https://your-project.supabase.co/auth/v1/callback`

## 🚢 배포

Vercel에 연결된 GitHub 저장소에 push하면 자동으로 배포됩니다.

```bash
git push origin main
```

## 📄 라이선스

MIT
