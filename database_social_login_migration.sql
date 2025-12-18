-- 소셜 로그인 전환을 위한 데이터베이스 마이그레이션
-- 실행 전: Supabase Dashboard > SQL Editor에서 실행하세요.

-- 1. trees 테이블에 user_id 컬럼 추가 (Supabase Auth의 user.id와 연결)
ALTER TABLE trees ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. password 컬럼 제거 (더 이상 필요 없음)
ALTER TABLE trees DROP COLUMN IF EXISTS password;

-- 3. user_id에 인덱스 추가 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_trees_user_id ON trees(user_id);

-- 4. RLS 정책 업데이트: 로그인한 사용자는 자신의 트리만 수정 가능
DROP POLICY IF EXISTS "Anyone can update trees" ON trees;
CREATE POLICY "Users can update own trees"
  ON trees
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. 트리 생성 정책: 로그인한 사용자만 생성 가능
DROP POLICY IF EXISTS "Anyone can create trees" ON trees;
CREATE POLICY "Authenticated users can create trees"
  ON trees
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 참고: 읽기는 여전히 모든 사용자에게 허용 (게스트 접근 가능)

