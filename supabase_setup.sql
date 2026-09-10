-- ============================================================
-- SOIS QP Management System — Supabase Table Setup
-- Run this ENTIRE script in Supabase SQL Editor
-- Dashboard: https://supabase.com/dashboard/project/cwrdmarlmwmitwpmztdh/sql/new
-- ============================================================

-- 1. SUBMISSIONS TABLE (stores faculty question paper submissions)
CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Allow anyone (anon) to INSERT, SELECT, UPDATE, DELETE submissions
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read submissions"
  ON submissions FOR SELECT USING (true);

CREATE POLICY "Allow anon insert submissions"
  ON submissions FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anon update submissions"
  ON submissions FOR UPDATE USING (true);

CREATE POLICY "Allow anon delete submissions"
  ON submissions FOR DELETE USING (true);

-- 2. USERS TABLE (stores registered faculty/manager accounts)
CREATE TABLE IF NOT EXISTS users (
  puniv_id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read users"
  ON users FOR SELECT USING (true);

CREATE POLICY "Allow anon insert users"
  ON users FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anon update users"
  ON users FOR UPDATE USING (true);

-- Done!
SELECT 'Setup complete! Tables created.' AS status;
