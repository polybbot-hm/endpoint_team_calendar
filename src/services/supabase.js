'use strict';

const { createClient } = require('@supabase/supabase-js');

let _client = null;

function getClient() {
  if (!_client) {
    _client = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
  }
  return _client;
}

const TABLE = process.env.CALENDAR_TABLE || 'calendar';
const BATCH = 500;

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------

/**
 * Upserts match rows into the calendar table in batches.
 * On conflict (event_id) all fields are overwritten so scores and status
 * stay up to date across ingestion runs.
 *
 * @param {Object[]} rows
 * @returns {Promise<number>} Total rows sent
 */
async function upsertMatches(rows) {
  if (!rows.length) return 0;

  const db = getClient();
  let total = 0;

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { error } = await db.from(TABLE).upsert(batch, { onConflict: 'event_id' });
    if (error) throw new Error(`Supabase upsert error: ${error.message}`);
    total += batch.length;
  }

  return total;
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

/**
 * Returns all matches in the season where the given team plays,
 * ordered chronologically.
 *
 * The team parameter is matched case-insensitively against both
 * home_team and away_team columns.
 *
 * @param {string} team  Full or partial team name
 * @param {string|null} [season] Temporada canónica YYYY/YY
 * @returns {Promise<Object[]>}
 */
async function getMatchesByTeam(team, season = null) {
  const db = getClient();
  const pattern = `%${team}%`;

  let query = db
    .from(TABLE)
    .select('*')
    .or(`home_team.ilike.${pattern},away_team.ilike.${pattern}`)
    .order('match_date', { ascending: true })
    .order('match_time', { ascending: true });

  if (season) {
    query = query.eq('season', season);
  }

  const { data, error } = await query;

  if (error) throw new Error(`Supabase query error: ${error.message}`);
  return data ?? [];
}

/**
 * Given a team name and a reference date, returns:
 *   - previous: the closest match BEFORE (or ON) that date
 *   - next:     the closest match AFTER (or ON) that date
 *
 * @param {string} team        Team name (matched with ilike)
 * @param {string} date        Reference date  YYYY-MM-DD
 * @param {string|null} [season] Temporada canónica YYYY/YY
 * @returns {Promise<{ previous: Object|null, next: Object|null }>}
 */
async function getMatchesAround(team, date, season = null) {
  const db = getClient();
  const pattern = `%${team}%`;
  const teamFilter = `home_team.ilike.${pattern},away_team.ilike.${pattern}`;

  let prevQuery = db
      .from(TABLE)
      .select('*')
      .or(teamFilter)
      .lt('match_date', date)
      .order('match_date', { ascending: false })
      .order('match_time', { ascending: false })
      .limit(1);

  let nextQuery = db
      .from(TABLE)
      .select('*')
      .or(teamFilter)
      .gt('match_date', date)
      .order('match_date', { ascending: true })
      .order('match_time', { ascending: true })
      .limit(1);

  if (season) {
    prevQuery = prevQuery.eq('season', season);
    nextQuery = nextQuery.eq('season', season);
  }

  const [prevRes, nextRes] = await Promise.all([prevQuery, nextQuery]);

  if (prevRes.error) throw new Error(`Supabase query error: ${prevRes.error.message}`);
  if (nextRes.error) throw new Error(`Supabase query error: ${nextRes.error.message}`);

  return {
    previous: prevRes.data?.[0] ?? null,
    next:     nextRes.data?.[0] ?? null,
  };
}

function getTableName() {
  return TABLE;
}

module.exports = { upsertMatches, getMatchesByTeam, getMatchesAround, getTableName };
