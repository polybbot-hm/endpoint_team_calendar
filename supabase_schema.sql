-- ============================================================
-- Run this once in your Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS calendar (
  event_id    INTEGER      PRIMARY KEY,
  home_team   VARCHAR(150) NOT NULL,
  away_team   VARCHAR(150) NOT NULL,
  match_date  DATE         NOT NULL,
  match_time  TIME,
  competition VARCHAR(150) NOT NULL,
  round       VARCHAR(100),
  status      VARCHAR(20)  NOT NULL DEFAULT 'scheduled',
  home_score  SMALLINT,
  away_score  SMALLINT,
  season      VARCHAR(10)  NOT NULL DEFAULT '2025/26',
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calendar_home_team   ON calendar (home_team);
CREATE INDEX IF NOT EXISTS idx_calendar_away_team   ON calendar (away_team);
CREATE INDEX IF NOT EXISTS idx_calendar_match_date  ON calendar (match_date);
CREATE INDEX IF NOT EXISTS idx_calendar_competition ON calendar (competition);
CREATE INDEX IF NOT EXISTS idx_calendar_season      ON calendar (season);
