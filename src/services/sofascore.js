'use strict';

const axios = require('axios');
const { TRACKED_TOURNAMENTS } = require('../config/teams');
const { normalizeSeason, seasonFromDate } = require('../utils/season');

const BASE_URL = 'https://api.sofascore.com/api/v1';

const http = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    Accept:          'application/json, text/plain, */*',
    'Accept-Language': 'es-ES,es;q=0.9',
    Referer:         'https://www.sofascore.com/',
    Origin:          'https://www.sofascore.com',
  },
});

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Fetches one page of events for a team from SofaScore.
 * @param {number} teamId
 * @param {'next'|'last'} direction
 * @param {number} page  0-indexed
 * @returns {Promise<Object[]>}
 */
async function fetchPage(teamId, direction, page) {
  const { data } = await http.get(`/team/${teamId}/events/${direction}/${page}`);
  return data.events ?? [];
}

/**
 * Paginates through events in one direction until:
 *   - there are no more pages (404 or empty response), or
 *   - the safety page cap is reached.
 *
 * @param {number} teamId
 * @param {'next'|'last'} direction
 * @param {{ seasonFilter: string|null }} options
 * @returns {Promise<Object[]>} Normalised in-scope events
 */
async function paginateDirection(teamId, direction, { seasonFilter }) {
  const results = [];

  for (let page = 0; page <= 60; page++) {
    let events;
    try {
      events = await fetchPage(teamId, direction, page);
    } catch (err) {
      if (err.response?.status === 404) break;
      throw err;
    }

    if (!events.length) break;

    for (const ev of events) {
      if (isTracked(ev)) {
        const row = toRow(ev);
        if (!seasonFilter || row.season === seasonFilter) {
          results.push(row);
        }
      }
    }
  }

  return results;
}

/**
 * Returns true when the event belongs to a tracked tournament.
 * @param {Object} ev  Raw SofaScore event
 */
function isTracked(ev) {
  const tid = ev.tournament?.uniqueTournament?.id;
  return tid !== undefined && Object.prototype.hasOwnProperty.call(TRACKED_TOURNAMENTS, tid);
}

/**
 * Converts a raw SofaScore event to a `matches` table row.
 * @param {Object} ev
 * @returns {Object}
 */
function toRow(ev) {
  const date = new Date(ev.startTimestamp * 1000);
  const tid  = ev.tournament?.uniqueTournament?.id;
  const season = getEventSeason(ev, date);

  const homeScore = ev.homeScore?.current ?? null;
  const awayScore = ev.awayScore?.current ?? null;

  return {
    event_id:    ev.id,
    home_team:   ev.homeTeam?.name  ?? null,
    away_team:   ev.awayTeam?.name  ?? null,
    match_date:  date.toISOString().slice(0, 10),          // YYYY-MM-DD
    match_time:  date.toISOString().slice(11, 16),         // HH:MM  (UTC)
    competition: TRACKED_TOURNAMENTS[tid] ?? ev.tournament?.name ?? 'Unknown',
    round:       ev.roundInfo?.name ?? (ev.roundInfo?.round != null ? String(ev.roundInfo.round) : null),
    status:      mapStatus(ev.status?.type),
    home_score:  homeScore,
    away_score:  awayScore,
    season,
    updated_at:  new Date().toISOString(),
  };
}

/**
 * Extrae la temporada del evento y la normaliza.
 * Si SofaScore no la trae, se calcula a partir de la fecha del partido.
 *
 * @param {Object} ev
 * @param {Date} date
 * @returns {string}
 */
function getEventSeason(ev, date) {
  const fromEvent =
    normalizeSeason(ev?.season?.name) ||
    normalizeSeason(ev?.season?.year);

  return fromEvent || seasonFromDate(date);
}

/**
 * Maps SofaScore status identifiers to our readable values.
 * @param {string|undefined} type
 * @returns {string}
 */
function mapStatus(type) {
  return (
    {
      notstarted:  'scheduled',
      inprogress:  'live',
      halftime:    'live',
      finished:    'finished',
      postponed:   'postponed',
      canceled:    'cancelled',
      interrupted: 'interrupted',
      suspended:   'suspended',
    }[type] ?? 'unknown'
  );
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetches all tracked matches for a team.
 * Combines past and future events, deduplicates by event_id, sorts by date.
 *
 * @param {number} teamId  SofaScore team ID
 * @param {{ season?: string }} [options]
 * @returns {Promise<Object[]>}  Array of match rows ready for Supabase
 */
async function fetchTeamMatches(teamId, options = {}) {
  const seasonFilter = options.season ? normalizeSeason(options.season) : null;
  if (options.season && !seasonFilter) {
    throw new Error('Invalid season format. Use YYYY/YY, YYYY-YY, YY/YY or YY-YY.');
  }

  const [past, upcoming] = await Promise.all([
    paginateDirection(teamId, 'last', { seasonFilter }),
    paginateDirection(teamId, 'next', { seasonFilter }),
  ]);

  // Deduplicate: a match appears in both teams' feeds — keep the latest copy
  const byId = new Map();
  for (const row of [...past, ...upcoming]) {
    byId.set(row.event_id, row);
  }

  return [...byId.values()].sort((a, b) =>
    a.match_date.localeCompare(b.match_date) || a.match_time.localeCompare(b.match_time)
  );
}

module.exports = { fetchTeamMatches };
