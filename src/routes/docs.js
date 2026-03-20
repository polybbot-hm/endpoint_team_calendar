'use strict';

const { Router } = require('express');
const fs = require('fs');
const path = require('path');
const { TEAMS } = require('../config/teams');

const router = Router();
const README_PATH = path.resolve(__dirname, '..', '..', 'README.md');
const OPENAPI_PATH = path.resolve(__dirname, '..', '..', 'openapi.json');

router.get('/', (_req, res) => {
  res.json({
    name: 'La Liga Calendar API',
    version: '1.0.0',
    endpoints: {
      'GET /health': 'Healthcheck endpoint',
      'GET /calendar?team={name}[&season={season}]': 'All matches for a team, optionally filtered by season',
      'GET /calendar/around?team={name}&date={date}[&season={season}]': 'Closest previous and next match around a date',
      'POST /ingest': 'Manual ingestion for all tracked teams into configured table',
      'POST /ingest/team': 'Manual ingestion for one team into configured table',
      'GET /docs': 'API documentation in JSON format',
      'GET /docs/readme': 'Project README in markdown',
      'GET /docs/openapi': 'OpenAPI specification in JSON format',
      'GET /docs/ui': 'Swagger UI',
    },
  });
});

router.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'La Liga Calendar API',
    timestamp: new Date().toISOString(),
  });
});

router.get('/docs', (_req, res) => {
  res.json({
    name: 'La Liga Calendar API',
    version: '1.0.0',
    season_formats: ['YYYY/YY', 'YYYY-YY', 'YY/YY', 'YY-YY'],
    supported_teams: TEAMS.map((team) => ({ id: team.id, name: team.name })),
    endpoints: [
      {
        method: 'GET',
        path: '/calendar',
        query: {
          team: 'string (required)',
          season: 'string (optional)',
        },
        description:
          'Devuelve todos los partidos del equipo en competiciones activas (La Liga, Copa y Europa), con opción de filtrar temporada.',
        example: '/calendar?team=Barcelona&season=25-26',
      },
      {
        method: 'GET',
        path: '/calendar/around',
        query: {
          team: 'string (required)',
          date: 'YYYY-MM-DD (required)',
          season: 'string (optional)',
        },
        description:
          'Devuelve el partido anterior y el siguiente alrededor de una fecha, con filtro opcional de temporada.',
        example: '/calendar/around?team=Barcelona&date=2026-03-16&season=25-26',
      },
      {
        method: 'POST',
        path: '/ingest',
        query: {
          season: 'string (optional)',
        },
        body: {
          season: 'string (optional)',
        },
        description:
          'Ejecuta la ingesta completa de todos los equipos y actualiza partidos existentes + inserta nuevos al avanzar competiciones. Acepta season por query o body.',
        example: {
          season: '25-26',
        },
      },
      {
        method: 'POST',
        path: '/ingest/team',
        body: {
          team: 'string (optional if team_id is provided)',
          team_id: 'number (optional if team is provided)',
          season: 'string (optional)',
        },
        description:
          'Ejecuta ingesta manual de todos los partidos del equipo en competiciones activas y hace upsert en la tabla configurada.',
        example: {
          team: 'Barcelona',
          season: '25-26',
        },
      },
      {
        method: 'GET',
        path: '/docs/readme',
        description: 'Devuelve el README del proyecto en formato markdown.',
      },
      {
        method: 'GET',
        path: '/docs/openapi',
        description: 'Devuelve la especificación OpenAPI en formato JSON.',
      },
      {
        method: 'GET',
        path: '/docs/ui',
        description: 'Devuelve Swagger UI para explorar y probar la API.',
      },
    ],
  });
});

router.get('/docs/readme', (_req, res) => {
  try {
    const readme = fs.readFileSync(README_PATH, 'utf8');
    res.type('text/markdown').send(readme);
  } catch (_err) {
    res.status(404).json({ error: 'README.md no encontrado.' });
  }
});

router.get('/docs/openapi', (_req, res) => {
  try {
    const openapi = fs.readFileSync(OPENAPI_PATH, 'utf8');
    res.type('application/json').send(openapi);
  } catch (_err) {
    res.status(404).json({ error: 'openapi.json no encontrado.' });
  }
});

router.get('/docs/ui', (_req, res) => {
  res.type('text/html').send(`<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>La Liga Calendar API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
    <style>
      body { margin: 0; background: #fafafa; }
      #swagger-ui { max-width: 1200px; margin: 0 auto; }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: '/docs/openapi',
        dom_id: '#swagger-ui',
      });
    </script>
  </body>
</html>`);
});

module.exports = router;
