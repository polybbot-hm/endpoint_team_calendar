'use strict';

const { Router } = require('express');
const { getMatchesByTeam, getMatchesAround } = require('../services/supabase');
const { normalizeSeason } = require('../utils/season');

const router = Router();

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// ---------------------------------------------------------------------------
// GET /calendar?team={name}
// ---------------------------------------------------------------------------
/**
 * Returns the full season calendar for a given team.
 *
 * Query params:
 *   team    {string}  Team name (case-insensitive partial match)
 *   season  {string}  Optional season filter (YYYY/YY, YYYY-YY, YY/YY, YY-YY)
 *
 * Example:
 *   GET /calendar?team=barcelona
 *   GET /calendar?team=Real Madrid
 *   GET /calendar?team=barcelona&season=25-26
 */
router.get('/calendar', async (req, res) => {
  const { team, season } = req.query;

  if (!team || !team.trim()) {
    return res.status(400).json({
      error: 'Missing required query param: team',
      example: '/calendar?team=barcelona',
    });
  }

  const normalizedSeason = season ? normalizeSeason(season) : null;
  if (season && !normalizedSeason) {
    return res.status(400).json({
      error: 'Invalid query param: season. Use YYYY/YY, YYYY-YY, YY/YY or YY-YY',
      example: '/calendar?team=barcelona&season=25-26',
    });
  }

  try {
    const matches = await getMatchesByTeam(team.trim(), normalizedSeason);

    if (!matches.length) {
      return res.status(404).json({
        error: `No matches found for team "${team}".`,
        hint:  'Make sure the ingestion has been run and check the team name spelling.',
      });
    }

    const competitions = [...new Set(matches.map((m) => m.competition))].sort();

    return res.json({
      team:        team.trim(),
      season:      normalizedSeason || 'all',
      total:       matches.length,
      competitions,
      matches,
    });
  } catch (err) {
    console.error('[GET /calendar]', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ---------------------------------------------------------------------------
// GET /calendar/around?team={name}&date={YYYY-MM-DD}
// ---------------------------------------------------------------------------
/**
 * Given a team and a reference date, returns the closest match before
 * and the closest match after that date.
 *
 * Query params:
 *   team    {string}  Team name (case-insensitive partial match)
 *   date    {string}  Reference date in YYYY-MM-DD format
 *   season  {string}  Optional season filter (YYYY/YY, YYYY-YY, YY/YY, YY-YY)
 *
 * Example:
 *   GET /calendar/around?team=barcelona&date=2026-03-16
 *   GET /calendar/around?team=barcelona&date=2026-03-16&season=25-26
 */
router.get('/calendar/around', async (req, res) => {
  const { team, date, season } = req.query;

  if (!team || !team.trim()) {
    return res.status(400).json({
      error: 'Missing required query param: team',
      example: '/calendar/around?team=barcelona&date=2026-03-16',
    });
  }

  if (!date || !DATE_REGEX.test(date)) {
    return res.status(400).json({
      error: 'Missing or invalid query param: date — expected format YYYY-MM-DD',
      example: '/calendar/around?team=barcelona&date=2026-03-16',
    });
  }

  const normalizedSeason = season ? normalizeSeason(season) : null;
  if (season && !normalizedSeason) {
    return res.status(400).json({
      error: 'Invalid query param: season. Use YYYY/YY, YYYY-YY, YY/YY or YY-YY',
      example: '/calendar/around?team=barcelona&date=2026-03-16&season=25-26',
    });
  }

  try {
    const { previous, next } = await getMatchesAround(team.trim(), date, normalizedSeason);

    if (!previous && !next) {
      return res.status(404).json({
        error: `No matches found around date "${date}" for team "${team}".`,
      });
    }

    return res.json({
      team:           team.trim(),
      reference_date: date,
      season:         normalizedSeason || 'all',
      previous,
      next,
    });
  } catch (err) {
    console.error('[GET /calendar/around]', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
