'use strict';

const { Router } = require('express');
const { getMatchesByTeam, getMatchesAround } = require('../services/supabase');

const router = Router();

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// ---------------------------------------------------------------------------
// GET /calendar?team={name}
// ---------------------------------------------------------------------------
/**
 * Returns the full season calendar for a given team.
 *
 * Query params:
 *   team  {string}  Team name (case-insensitive partial match)
 *
 * Example:
 *   GET /calendar?team=barcelona
 *   GET /calendar?team=Real Madrid
 */
router.get('/calendar', async (req, res) => {
  const { team } = req.query;

  if (!team || !team.trim()) {
    return res.status(400).json({
      error: 'Missing required query param: team',
      example: '/calendar?team=barcelona',
    });
  }

  try {
    const matches = await getMatchesByTeam(team.trim());

    if (!matches.length) {
      return res.status(404).json({
        error: `No matches found for team "${team}".`,
        hint:  'Make sure the ingestion has been run and check the team name spelling.',
      });
    }

    const competitions = [...new Set(matches.map((m) => m.competition))].sort();

    return res.json({
      team:        team.trim(),
      season:      matches[0].season,
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
 *   team  {string}  Team name (case-insensitive partial match)
 *   date  {string}  Reference date in YYYY-MM-DD format
 *
 * Example:
 *   GET /calendar/around?team=barcelona&date=2026-03-16
 */
router.get('/calendar/around', async (req, res) => {
  const { team, date } = req.query;

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

  try {
    const { previous, next } = await getMatchesAround(team.trim(), date);

    if (!previous && !next) {
      return res.status(404).json({
        error: `No matches found around date "${date}" for team "${team}".`,
      });
    }

    return res.json({
      team:           team.trim(),
      reference_date: date,
      previous,
      next,
    });
  } catch (err) {
    console.error('[GET /calendar/around]', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
