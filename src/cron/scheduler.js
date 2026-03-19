'use strict';

const cron = require('node-cron');
const { runIngestion } = require('../ingestion/ingest');

/**
 * Schedules the weekly ingestion job.
 *
 * Cron expression: 0 3 * * 0
 *   ┌─ minute  (0)
 *   ├─ hour    (3)
 *   ├─ day     (* = every day of the month)
 *   ├─ month   (* = every month)
 *   └─ weekday (0 = Sunday)
 *
 * Runs every Sunday at 03:00 UTC.
 */
function startScheduler() {
  cron.schedule(
    '0 3 * * 0',
    () => {
      runIngestion().catch((err) =>
        console.error('[scheduler] Unhandled error during ingestion:', err)
      );
    },
    { timezone: 'UTC' }
  );

  console.log('[scheduler] Ingestion job scheduled — Sundays at 03:00 UTC');
}

module.exports = { startScheduler };
