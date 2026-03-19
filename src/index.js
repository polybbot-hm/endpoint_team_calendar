'use strict';

require('dotenv').config();

const express        = require('express');
const calendarRouter = require('./routes/calendar');
const { startScheduler } = require('./cron/scheduler');

// ---------------------------------------------------------------------------
// Validate environment
// ---------------------------------------------------------------------------
['SUPABASE_URL', 'SUPABASE_ANON_KEY'].forEach((key) => {
  if (!process.env[key]) {
    console.error(`[startup] Missing required environment variable: ${key}`);
    process.exit(1);
  }
});

// ---------------------------------------------------------------------------
// Express
// ---------------------------------------------------------------------------
const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (_req, res) => {
  res.json({
    name:    'La Liga Calendar API',
    version: '1.0.0',
    endpoints: {
      'GET /calendar?team={name}':                  'Full season calendar for a team',
      'GET /calendar/around?team={name}&date={date}': 'Match before and after a given date',
    },
  });
});

app.use(calendarRouter);

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`[server]    Listening on port ${PORT}`);
  startScheduler();
});
