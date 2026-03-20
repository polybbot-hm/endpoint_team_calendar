'use strict';

const express = require('express');
const { validateEnv } = require('./config/env');
const docsRouter = require('./routes/docs');
const calendarRouter = require('./routes/calendar');
const ingestionRouter = require('./routes/ingestion');

validateEnv();

const app = express();

app.use(express.json());
app.use(docsRouter);
app.use(calendarRouter);
app.use(ingestionRouter);

module.exports = app;
