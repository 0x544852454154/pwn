-- =============================================
-- pwnlab Supabase Migration
-- =============================================
-- This migration sets up the pwnlab platform on Supabase
-- Run this in the Supabase SQL Editor
-- =============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- ENUMS
-- =============================================
CREATE TYPE difficulty_level AS ENUM ('EASY', 'MEDIUM', 'HARD', 'INSANE');
CREATE TYPE challenge_visibility AS ENUM ('PUBLIC', 'PRIVATE', 'TEAM ONLY');
CREATE TYPE team_role AS ENUM ('OWNER', 'MEMBER', 'CAPTAIN');
CREATE TYPE competition_mode AS ENUM ('TEAM', 'INDIVIDUAL');
CREATE TYPE competition_status AS ENUM ('SCHEDULED', 'LIVE', 'ENDED');

-- =============================================
-- TABLES
-- =============================================

-- Users profile table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) UNIQUE NOT NULL,
  pin_hash VARCHAR(255),
  avatar_url TEXT,
  bio TEXT,
  country_code VARCHAR(2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_username ON public.users(username);

-- Sessions
CREATE TABLE IF NOT EXISTS public.sessions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_token ON public.sessions(token);
CREATE INDEX idx_sessions_user ON public.sessions(user_id);

-- Challenge categories
CREATE TABLE IF NOT EXISTS public.challenge_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Challenges
CREATE TABLE IF NOT EXISTS public.challenges (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category_id INTEGER REFERENCES public.challenge_categories(id),
  difficulty difficulty_level NOT NULL DEFAULT 'EASY',
  points INTEGER NOT NULL DEFAULT 50,
  estimated_time INTEGER,
  flag VARCHAR(255) NOT NULL,
  creator_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  visibility challenge_visibility DEFAULT 'PUBLIC',
  storage_path TEXT,
  is_dynamic_scoring BOOLEAN DEFAULT FALSE,
  min_points INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_challenges_category ON public.challenges(category_id);
CREATE INDEX idx_challenges_difficulty ON public.challenges(difficulty);
CREATE INDEX idx_challenges_visibility ON public.challenges(visibility);

-- Challenge objectives
CREATE TABLE IF NOT EXISTS public.challenge_objectives (
  id SERIAL PRIMARY KEY,
  challenge_id INTEGER REFERENCES public.challenges(id) ON DELETE CASCADE,
  objective TEXT NOT NULL,
  order_num INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Challenge hints
CREATE TABLE IF NOT EXISTS public.challenge_hints (
  id SERIAL PRIMARY KEY,
  challenge_id INTEGER REFERENCES public.challenges(id) ON DELETE CASCADE,
  hint_text TEXT NOT NULL,
  point_penalty INTEGER DEFAULT 0,
  order_num INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Challenge files metadata (files stored in Supabase Storage)
CREATE TABLE IF NOT EXISTS public.challenge_files (
  id SERIAL PRIMARY KEY,
  challenge_id INTEGER REFERENCES public.challenges(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  storage_path TEXT NOT NULL,
  size_bytes BIGINT,
  mime_type VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Discord accounts linking
CREATE TABLE IF NOT EXISTS public.discord_accounts (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  discord_id VARCHAR(50) UNIQUE NOT NULL,
  username VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_discord_accounts_discord_id ON public.discord_accounts(discord_id);
CREATE INDEX idx_discord_accounts_user_id ON public.discord_accounts(user_id);

-- User profiles (extended info)
CREATE TABLE IF NOT EXISTS public.profiles (
  id SERIAL PRIMARY KEY,
  user_id UUID UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  bio TEXT,
  total_points INTEGER DEFAULT 0,
  challenges_solved INTEGER DEFAULT 0,
  rank_title VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Challenge submissions
CREATE TABLE IF NOT EXISTS public.challenge_submissions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  challenge_id INTEGER REFERENCES public.challenges(id) ON DELETE CASCADE,
  flag_submitted VARCHAR(255) NOT NULL,
  is_correct BOOLEAN DEFAULT FALSE,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, challenge_id)
);

-- Challenge completions
CREATE TABLE IF NOT EXISTS public.challenge_completions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  challenge_id INTEGER REFERENCES public.challenges(id) ON DELETE CASCADE,
  points_earned INTEGER NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, challenge_id)
);

CREATE INDEX idx_completions_user ON public.challenge_completions(user_id);
CREATE INDEX idx_completions_challenge ON public.challenge_completions(challenge_id);

-- Machines
CREATE TABLE IF NOT EXISTS public.machines (
  id SERIAL PRIMARY KEY,
  challenge_id INTEGER REFERENCES public.challenges(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  target_ip VARCHAR(45),
  ports TEXT,
  status VARCHAR(20) DEFAULT 'STOPPED',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Machine instances
CREATE TABLE IF NOT EXISTS public.machine_instances (
  id SERIAL PRIMARY KEY,
  machine_id INTEGER REFERENCES public.machines(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  instance_id VARCHAR(50) UNIQUE,
  status VARCHAR(20) DEFAULT 'RUNNING',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  target_ip VARCHAR(45)
);

-- Teams
CREATE TABLE IF NOT EXISTS public.teams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  owner_id UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team members
CREATE TABLE IF NOT EXISTS public.team_members (
  id SERIAL PRIMARY KEY,
  team_id INTEGER REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  role team_role DEFAULT 'MEMBER',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- Competitions
CREATE TABLE IF NOT EXISTS public.competitions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  creator_id UUID REFERENCES public.users(id),
  description TEXT,
  mode competition_mode DEFAULT 'TEAM',
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  status competition_status DEFAULT 'SCHEDULED',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Competition participants
CREATE TABLE IF NOT EXISTS public.competition_participants (
  id SERIAL PRIMARY KEY,
  competition_id INTEGER REFERENCES public.competitions(id) ON DELETE CASCADE,
  team_id INTEGER REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  points_earned INTEGER DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- User notes
CREATE TABLE IF NOT EXISTS public.user_notes (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  challenge_id INTEGER REFERENCES public.challenges(id) ON DELETE CASCADE,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity log
CREATE TABLE IF NOT EXISTS public.activity_log (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  action VARCHAR(255) NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_user ON public.activity_log(user_id);
CREATE INDEX idx_activity_created ON public.activity_log(created_at DESC);

-- Audit log
CREATE TABLE IF NOT EXISTS public.audit_log (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  action VARCHAR(255) NOT NULL,
  resource_type VARCHAR(100),
  resource_id INTEGER,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TRIGGERS
-- =============================================

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_challenges_updated_at
  BEFORE UPDATE ON public.challenges
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile when user signs up
-- NOTE: This trigger is disabled because it causes foreign key violations.
-- Profiles are created explicitly in application code after user creation.
-- CREATE OR REPLACE FUNCTION public.handle_new_user()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   INSERT INTO public.profiles (user_id)
--   VALUES (NEW.id);
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;
--
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_hints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discord_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machine_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Users: public read, owner can update
CREATE POLICY "Users are viewable by everyone" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Challenge categories: public read
CREATE POLICY "Categories are viewable by everyone" ON public.challenge_categories
  FOR SELECT USING (true);

-- Challenges: public read for PUBLIC visibility
CREATE POLICY "Public challenges are viewable by everyone" ON public.challenges
  FOR SELECT USING (visibility = 'PUBLIC' OR auth.uid() = creator_id);

-- Challenge objectives: public read for public challenges
CREATE POLICY "Objectives viewable with challenge" ON public.challenge_objectives
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.challenges WHERE id = challenge_id AND visibility = 'PUBLIC')
  );

-- Challenge hints: public read
CREATE POLICY "Hints viewable with challenge" ON public.challenge_hints
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.challenges WHERE id = challenge_id AND visibility = 'PUBLIC')
  );

-- Challenge files: public read for public challenges
CREATE POLICY "Files viewable with challenge" ON public.challenge_files
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.challenges WHERE id = challenge_id AND visibility = 'PUBLIC')
  );

-- Discord accounts: owner can read/write
CREATE POLICY "Users can view own discord link" ON public.discord_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own discord link" ON public.discord_accounts
  FOR ALL USING (auth.uid() = user_id);

-- Profiles: public read, owner can update
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile data" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Submissions: only own submissions
CREATE POLICY "Users can view own submissions" ON public.challenge_submissions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own submissions" ON public.challenge_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own submissions" ON public.challenge_submissions
  FOR UPDATE USING (auth.uid() = user_id);

-- Completions: public read, only own inserts
CREATE POLICY "Completions are viewable by everyone" ON public.challenge_completions
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own completions" ON public.challenge_completions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Machines: public read
CREATE POLICY "Machines are viewable by everyone" ON public.machines
  FOR SELECT USING (true);

-- Machine instances: only own
CREATE POLICY "Users can view own instances" ON public.machine_instances
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own instances" ON public.machine_instances
  FOR ALL USING (auth.uid() = user_id);

-- Teams: public read
CREATE POLICY "Teams are viewable by everyone" ON public.teams
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create teams" ON public.teams
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update teams" ON public.teams
  FOR UPDATE USING (auth.uid() = owner_id);

-- Team members: public read
CREATE POLICY "Team members are viewable by everyone" ON public.team_members
  FOR SELECT USING (true);

CREATE POLICY "Users can join teams" ON public.team_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave teams" ON public.team_members
  FOR DELETE USING (auth.uid() = user_id);

-- Competitions: public read
CREATE POLICY "Competitions are viewable by everyone" ON public.competitions
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create competitions" ON public.competitions
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- Competition participants: public read
CREATE POLICY "Participants are viewable by everyone" ON public.competition_participants
  FOR SELECT USING (true);

CREATE POLICY "Users can join competitions" ON public.competition_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User notes: only own
CREATE POLICY "Users can manage own notes" ON public.user_notes
  FOR ALL USING (auth.uid() = user_id);

-- Activity log: public read, only own inserts
CREATE POLICY "Activity is viewable by everyone" ON public.activity_log
  FOR SELECT USING (true);

CREATE POLICY "Users can log own activity" ON public.activity_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Audit log: only admins (no public access)
CREATE POLICY "No public access to audit log" ON public.audit_log
  FOR ALL USING (false);

-- =============================================
-- SEED DATA
-- =============================================

INSERT INTO public.challenge_categories (name, slug, description, icon) VALUES
  ('LINUX', 'linux', 'Linux command line and system administration', 'terminal'),
  ('NETWORKING', 'networking', 'Network protocols and analysis', 'network'),
  ('WEB', 'web', 'Web application security', 'globe'),
  ('CRYPTOGRAPHY', 'crypto', 'Cryptography and cipher challenges', 'lock'),
  ('FORENSICS', 'forensics', 'Digital forensics and analysis', 'search'),
  ('OSINT', 'osint', 'Open source intelligence', 'eye'),
  ('REVERSE ENGINEERING', 'reverse', 'Binary reverse engineering', 'code'),
  ('BINARY EXPLOITATION', 'pwn', 'Binary exploitation and pwn', 'bug'),
  ('PRIVILEGE ESCALATION', 'privesc', 'Linux and Windows privilege escalation', 'shield'),
  ('ACTIVE DIRECTORY', 'ad', 'Active Directory attacks', 'users'),
  ('API SECURITY', 'api', 'API security testing', 'plug'),
  ('STEGANOGRAPHY', 'stego', 'Steganography challenges', 'image'),
  ('MALWARE ANALYSIS', 'malware', 'Malware analysis and reversing', 'skull')
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- HELPFUL VIEWS
-- =============================================

-- Leaderboard view
CREATE OR REPLACE VIEW public.leaderboard AS
SELECT
  u.id AS user_id,
  u.username,
  u.avatar_url,
  COALESCE(SUM(cc.points_earned), 0) AS total_points,
  COUNT(DISTINCT cc.challenge_id) AS challenges_solved,
  RANK() OVER (ORDER BY COALESCE(SUM(cc.points_earned), 0) DESC) AS rank
FROM public.users u
LEFT JOIN public.challenge_completions cc ON u.id = cc.user_id
GROUP BY u.id, u.username, u.avatar_url
ORDER BY total_points DESC;

-- Challenge stats view
CREATE OR REPLACE VIEW public.challenge_stats AS
SELECT
  c.id,
  c.name,
  c.difficulty,
  c.points,
  cc.name AS category,
  COUNT(DISTINCT comp.id) AS solve_count
FROM public.challenges c
LEFT JOIN public.challenge_categories cc ON c.category_id = cc.id
LEFT JOIN public.challenge_completions comp ON c.id = comp.challenge_id
WHERE c.visibility = 'PUBLIC'
GROUP BY c.id, c.name, c.difficulty, c.points, cc.name;

-- =============================================
-- DONE
-- =============================================
-- Migration complete. Your Supabase database is ready for pwnlab.
