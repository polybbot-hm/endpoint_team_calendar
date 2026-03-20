'use strict';

const { Router } = require('express');
const { runIngestion, runTeamIngestion } = require('../ingestion/ingest');
const { normalizeSeason } = require('../utils/season');
const { getTableName } = require('../services/supabase');

const router = Router();

router.post('/ingest', async (req, res) => {
  const season = req.body?.season ?? req.query?.season;

  const normalizedSeason = season ? normalizeSeason(season) : null;
  if (season && !normalizedSeason) {
    return res.status(400).json({
      error: 'Invalid season. Use YYYY/YY, YYYY-YY, YY/YY or YY-YY',
      example: {
        season: '25-26',
      },
    });
  }

  try {
    const result = await runIngestion({ season: normalizedSeason || undefined });

    return res.json({
      ok: true,
      season: normalizedSeason || 'all',
      table: getTableName(),
      ...result,
      message: 'Full ingestion completed successfully.',
    });
  } catch (err) {
    console.error('[POST /ingest]', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.post('/ingest/team', async (req, res) => {
  const { team, team_id: teamId, season } = req.body ?? {};

  if ((!team || !String(team).trim()) && (teamId == null || String(teamId).trim() === '')) {
    return res.status(400).json({
      error: 'Missing body param: team or team_id is required.',
      example: {
        team: 'barcelona',
        season: '25-26',
      },
    });
  }

  const normalizedSeason = season ? normalizeSeason(season) : null;
  if (season && !normalizedSeason) {
    return res.status(400).json({
      error: 'Invalid body param: season. Use YYYY/YY, YYYY-YY, YY/YY or YY-YY',
      example: {
        team: 'barcelona',
        season: '25-26',
      },
    });
  }

  try {
    const result = await runTeamIngestion({
      team: team ? String(team).trim() : undefined,
      teamId,
      season: normalizedSeason || undefined,
    });

    return res.json({
      ok: true,
      ...result,
      message: 'Ingestion completed successfully.',
    });
  } catch (err) {
    if (err.message.startsWith('Team not found') || err.message.startsWith('Ambiguous') || err.message.startsWith('Missing required field')) {
      return res.status(400).json({ error: err.message });
    }

    console.error('[POST /ingest/team]', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
