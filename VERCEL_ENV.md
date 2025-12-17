# Vercel 배포 시 필요한 환경 변수

## 필수 환경 변수

Vercel 대시보드에서 다음 환경 변수들을 추가해주세요:

### 1. Supabase 클라이언트 (클라이언트/서버 공용) - 필수

**주의: `NEXT_PUBLIC_` 접두사가 반드시 필요합니다!** (클라이언트에서도 사용)

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Supabase 서버 사이드 (서버 전용 - 선택적)

서버 사이드 관리 작업(reset 등)이 필요한 경우:

```
SUPABASE_SECRET_KEY=your_supabase_service_role_key
```

또는

```
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. Google Gemini API (서버 전용 - 필수)

AI 산타 분석 기능:

```
GEMINI_API_KEY=your_gemini_api_key
```

### 4. Admin Secret (서버 전용 - 선택적)

관리자 기능 보안:

```
NEXT_PUBLIC_XMAS_ADMIN_SECRET=your_secret_string
```

## 주의사항

1. **루트 디렉토리**: `./` (기본값, 변경 불필요)
2. **프레임워크**: Next.js (자동 감지)
3. **NEXT*PUBLIC* 접두사 규칙**:
   - **클라이언트에서도 사용하는 변수**: `NEXT_PUBLIC_` 접두사 **필수**
     - 예: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **서버 전용 변수**: `NEXT_PUBLIC_` 접두사 **없이** 설정
     - 예: `GEMINI_API_KEY`, `SUPABASE_SECRET_KEY`, `XMAS_ADMIN_SECRET`
   - ⚠️ `NEXT_PUBLIC_`로 시작하는 변수는 클라이언트 번들에 포함되어 브라우저에서 접근 가능하므로, 민감한 정보(API 키 등)는 절대 `NEXT_PUBLIC_`를 붙이지 마세요!

## 환경 변수 찾는 방법

### Supabase

1. Supabase Dashboard > Project Settings > API
2. `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
3. `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. `service_role secret` key → `SUPABASE_SECRET_KEY` (서버 전용)

### Gemini API

1. Google AI Studio (https://aistudio.google.com/)
2. API Key 생성 → `GEMINI_API_KEY`
