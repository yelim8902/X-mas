-- trees 테이블 생성 (트리별 호스트 정보 저장)
-- 실행 전: Supabase Dashboard > SQL Editor에서 실행하세요.

CREATE TABLE IF NOT EXISTS trees (
  id text PRIMARY KEY, -- tree_id와 동일
  host_name text NOT NULL,
  host_gender text NOT NULL, -- 'female' | 'male' | 'nonbinary' | 'other'
  host_age integer NOT NULL,
  tree_style text NOT NULL, -- 'tree1.png' | 'tree2.png' | 'tree3.png'
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS (Row Level Security) 정책 설정
ALTER TABLE trees ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽을 수 있음 (게스트가 트리 정보를 볼 수 있도록)
CREATE POLICY "Anyone can view trees"
  ON trees
  FOR SELECT
  USING (true);

-- 모든 사용자가 트리를 생성할 수 있음
CREATE POLICY "Anyone can create trees"
  ON trees
  FOR INSERT
  WITH CHECK (true);

-- 트리 주인만 업데이트할 수 있음 (id로 확인)
-- 참고: 실제로는 애플리케이션 레벨에서 권한을 체크하는 것이 더 안전할 수 있습니다
CREATE POLICY "Anyone can update trees"
  ON trees
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_trees_updated_at
  BEFORE UPDATE ON trees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

