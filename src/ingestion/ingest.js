'use strict';

const { TEAMS } = require('../config/teams');
const { fetchTeamMatches } = require('../services/sofascore');
const { upsertMatches, getTableName } = require('../services/supabase');

const DELAY_BETWEEN_TEAMS_MS = 2000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Runs a full ingestion cycle:
 *   1. Iterates over all 20 La Liga teams.
 *   2. Fetches every tracked match from SofaScore (optionally filtered by season).
 *   3. Upserts into Supabase — new matches are inserted, existing ones updated.
 *
 * Matches shared between two La Liga teams (e.g. Real Madrid vs Barcelona)
 * are fetched twice but only stored once thanks to the event_id primary key.
 *
 * @param {{ season?: string }} [options]
 * @returns {Promise<{ teams: number, matches: number, errors: number }>}
 */
async function runIngestion(options = {}) {
  const startedAt = new Date();
  const seasonLabel = options.season ? ` (season=${options.season})` : ' (all seasons)';
  console.log(`[ingest] Starting — ${startedAt.toISOString()}`);
  console.log(`[ingest] Teams: ${TEAMS.length}${seasonLabel}\n`);

  let totalMatches = 0;
  let errors       = 0;

  for (const team of TEAMS) {
    process.stdout.write(`  ${team.name.padEnd(14)} → `);

    try {
      const rows = await fetchTeamMatches(team.id, { season: options.season });
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

/**
 * Busca un equipo por id o por nombre parcial.
 *
 * @param {{ team?: string, teamId?: number }} params
 * @returns {{ id: number, name: string }}
 */
function resolveTeam(params = {}) {
  if (params.teamId != null) {
    const numericId = Number(params.teamId);
    const teamById = TEAMS.find((t) => t.id === numericId);
    if (!teamById) {
      throw new Error(`Team not found for team_id=${params.teamId}.`);
    }
    return teamById;
  }

  const query = (params.team || '').trim().toLowerCase();
  if (!query) {
    throw new Error('Missing required field: team or team_id.');
  }

  const matches = TEAMS.filter((t) => t.name.toLowerCase().includes(query));
  if (!matches.length) {
    throw new Error(`Team not found for query "${params.team}".`);
  }

  if (matches.length > 1) {
    const names = matches.map((t) => t.name).join(', ');
    throw new Error(`Ambiguous team query "${params.team}". Matches: ${names}.`);
  }

  return matches[0];
}

/**
 * Ejecuta ingesta de un solo equipo y persiste en la tabla configurada.
 *
 * @param {{ team?: string, teamId?: number, season?: string }} params
 * @returns {Promise<{ team: string, team_id: number, season: string, competitions: string[], fetched: number, upserted: number, table: string }>}
 */
async function runTeamIngestion(params = {}) {
  const selectedTeam = resolveTeam(params);
  const rows = await fetchTeamMatches(selectedTeam.id, { season: params.season });
  const upserted = await upsertMatches(rows);
  const competitions = [...new Set(rows.map((m) => m.competition))].sort();

  return {
    team: selectedTeam.name,
    team_id: selectedTeam.id,
    season: params.season || 'all',
    competitions,
    fetched: rows.length,
    upserted,
    table: getTableName(),
  };
}

module.exports = { runIngestion, runTeamIngestion };
