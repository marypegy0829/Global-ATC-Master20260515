-- 1. Create independent Schema
CREATE SCHEMA IF NOT EXISTS app_eco;

-- 1.b Grant usage to Supabase roles
GRANT USAGE ON SCHEMA app_eco TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA app_eco TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA app_eco TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA app_eco TO anon, authenticated;

-- 2. Create profiles table linked to auth.users
CREATE TABLE IF NOT EXISTS app_eco.profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  email TEXT,
  name TEXT,
  aircraft TEXT,
  country TEXT,
  rank TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Create records table for transcription history
CREATE TABLE IF NOT EXISTS app_eco.records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT,
  country TEXT,
  aircraft_type TEXT,
  user_persona TEXT,
  output_mode TEXT,
  assessment_target TEXT,
  cbta_report BOOLEAN,
  is_favorite BOOLEAN DEFAULT FALSE,
  result_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Enable RLS
ALTER TABLE app_eco.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_eco.records ENABLE ROW LEVEL SECURITY;

-- (Optional) If you already created records table before, run this to add the is_favorite column:
-- ALTER TABLE app_eco.records ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;

-- 5. RLS Policies for profiles
CREATE POLICY "Users can view own profile" 
ON app_eco.profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON app_eco.profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
ON app_eco.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 6. RLS Policies for records
CREATE POLICY "Users can view own records" 
ON app_eco.records FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own records" 
ON app_eco.records FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own records" 
ON app_eco.records FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own records" 
ON app_eco.records FOR DELETE 
USING (auth.uid() = user_id);

