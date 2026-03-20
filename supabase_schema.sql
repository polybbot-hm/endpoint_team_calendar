-- ============================================================
-- Fresh schema for current API version
-- Target table: liga_calendar
-- ============================================================

-- Si quieres recrear desde cero en una base vacia, puedes descomentar:
-- DROP TABLE IF EXISTS liga_calendar;

CREATE TABLE IF NOT EXISTS liga_calendar (
  event_id    INTEGER PRIMARY KEY,
  home_team   VARCHAR(150),
  away_team   VARCHAR(150),
  match_date  DATE NOT NULL,
  match_time  TIME,
  competition VARCHAR(150) NOT NULL,
  round       VARCHAR(100),
  status      VARCHAR(20) NOT NULL DEFAULT 'scheduled',
  home_score  SMALLINT,
  away_score  SMALLINT,
  season      VARCHAR(10) NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_liga_calendar_home_team
  ON liga_calendar (home_team);
CREATE INDEX IF NOT EXISTS idx_liga_calendar_away_team
  ON liga_calendar (away_team);
CREATE INDEX IF NOT EXISTS idx_liga_calendar_match_date
  ON liga_calendar (match_date);
CREATE INDEX IF NOT EXISTS idx_liga_calendar_competition
  ON liga_calendar (competition);
CREATE INDEX IF NOT EXISTS idx_liga_calendar_season
  ON liga_calendar (season);
