-- trees 테이블에 비밀번호 필드 추가
-- 실행 전: Supabase Dashboard > SQL Editor에서 실행하세요.

ALTER TABLE trees ADD COLUMN IF NOT EXISTS password text;

-- 비밀번호는 해시된 형태로 저장하는 것을 권장하지만, 
-- 간단한 구현을 위해 평문으로 저장 (보안이 필요한 경우 나중에 해시로 변경 가능)
-- 비밀번호는 4-6자리 숫자로 제한

