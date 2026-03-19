'use strict';

const { TEAMS } = require('../config/teams');
const { fetchTeamMatches } = require('../services/sofascore');
const { upsertMatches } = require('../services/supabase');

const DELAY_BETWEEN_TEAMS_MS = 2000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Runs a full ingestion cycle:
 *   1. Iterates over all 20 La Liga teams.
 *   2. Fetches every tracked match for the season from SofaScore.
 *   3. Upserts into Supabase — new matches are inserted, existing ones updated.
 *
 * Matches shared between two La Liga teams (e.g. Real Madrid vs Barcelona)
 * are fetched twice but only stored once thanks to the event_id primary key.
 *
 * @returns {Promise<{ teams: number, matches: number, errors: number }>}
 */
async function runIngestion() {
  const startedAt = new Date();
  console.log(`[ingest] Starting — ${startedAt.toISOString()}`);
  console.log(`[ingest] Teams: ${TEAMS.length}\n`);

  let totalMatches = 0;
  let errors       = 0;

  for (const team of TEAMS) {
    process.stdout.write(`  ${team.name.padEnd(14)} → `);

    try {
      const rows = await fetchTeamMatches(team.id);
      await upsertMatches(rows);

      console.log(`${String(rows.length).padStart(3)} matches upserted`);
      totalMatches += rows.length;
    } catch (err) {
      console.log(`ERROR — ${err.message}`);
      errors++;
    }

    await sleep(DELAY_BETWEEN_TEAMS_MS);
  }

  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);

  console.log('\n[ingest] ─────────────────────────────────');
  console.log(`[ingest] Finished in ${elapsed}s`);
  console.log(`[ingest] Teams OK  : ${TEAMS.length - errors}/${TEAMS.length}`);
  console.log(`[ingest] Rows sent : ${totalMatches} (dupes ignored by PK)`);
  if (errors) console.log(`[ingest] Errors    : ${errors}`);
  console.log('[ingest] ─────────────────────────────────\n');

  return { teams: TEAMS.length - errors, matches: totalMatches, errors };
}

module.exports = { runIngestion };
