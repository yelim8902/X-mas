-- 데이터베이스 스키마 업데이트
-- 실행 전: Supabase Dashboard > SQL Editor에서 실행하세요.

-- 1. 위치 고정을 위한 좌표 컬럼 추가 (0~100% 저장)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS position_x numeric;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS position_y numeric;

-- 2. 읽음 표시 기능을 위한 컬럼 추가
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false;

-- 3. 중복 컬럼 삭제 (decoration_type은 사용하지 않으므로 안전하게 삭제 가능)
ALTER TABLE messages DROP COLUMN IF EXISTS decoration_type;

-- 확인용: 업데이트된 스키마 조회
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'messages' 
-- ORDER BY ordinal_position;

