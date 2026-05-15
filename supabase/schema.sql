-- Supabase Schema for Global ATC Master

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. user_profiles
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    aircraft_type TEXT DEFAULT 'B737-800',
    rank TEXT,
    country TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);

-- 2. atc_batches
CREATE TABLE IF NOT EXISTS atc_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    country_code TEXT,
    status TEXT CHECK (status IN ('processing', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for atc_batches
ALTER TABLE atc_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own batches" ON atc_batches FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own batches" ON atc_batches FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. atc_segments
CREATE TABLE IF NOT EXISTS atc_segments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID REFERENCES atc_batches(id) ON DELETE CASCADE,
    sequence_order INTEGER CHECK (sequence_order >= 1 AND sequence_order <= 10),
    audio_url TEXT,
    raw_text TEXT,
    translated_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for atc_segments
ALTER TABLE atc_segments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view segments of their batches" ON atc_segments FOR SELECT USING (
    EXISTS (SELECT 1 FROM atc_batches WHERE id = atc_segments.batch_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert segments to their batches" ON atc_segments FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM atc_batches WHERE id = atc_segments.batch_id AND user_id = auth.uid())
);

-- 4. cbta_reports
CREATE TABLE IF NOT EXISTS cbta_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID REFERENCES atc_batches(id) ON DELETE CASCADE UNIQUE,
    pronunciation_score INTEGER CHECK (pronunciation_score BETWEEN 1 AND 6),
    structure_score INTEGER CHECK (structure_score BETWEEN 1 AND 6),
    vocabulary_score INTEGER CHECK (vocabulary_score BETWEEN 1 AND 6),
    fluency_score INTEGER CHECK (fluency_score BETWEEN 1 AND 6),
    comprehension_score INTEGER CHECK (comprehension_score BETWEEN 1 AND 6),
    interaction_score INTEGER CHECK (interaction_score BETWEEN 1 AND 6),
    json_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for cbta_reports
ALTER TABLE cbta_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view reports of their batches" ON cbta_reports FOR SELECT USING (
    EXISTS (SELECT 1 FROM atc_batches WHERE id = cbta_reports.batch_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert reports to their batches" ON cbta_reports FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM atc_batches WHERE id = cbta_reports.batch_id AND user_id = auth.uid())
);

-- ==============================================================================
-- 任务 2：创建存储桶 (Storage Bucket) 说明
-- ==============================================================================
-- 1. 登录 Supabase Dashboard，进入 "Storage" 模块。
-- 2. 点击 "New Bucket" 创建一个新的存储桶。
-- 3. Bucket Name: `atc_audio_vault`
-- 4. 将该桶设备为 "Restricted" (私有)。
-- 5. Configuration: 
--    - Allowed MIME types: 'audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/m4a'
--    - Maximum file size: 30MB
-- 6. 添加 Storage RLS 策略，确保只有对应 Authenticated 的 User 才能上传并在日后读取属于自己的音频记录。
