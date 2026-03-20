'use strict';

/**
 * LaLiga 2025/2026 teams with their SofaScore team IDs.
 */
const TEAMS = [
  { id: 2817,  name: 'Barcelona' },
  { id: 2829,  name: 'Real Madrid' },
  { id: 2836,  name: 'Atlético Madrid' },
  { id: 2819,  name: 'Villarreal' },
  { id: 2816,  name: 'Real Betis' },
  { id: 2821,  name: 'Celta Vigo' },
  { id: 2824,  name: 'Real Sociedad' },
  { id: 2814,  name: 'Espanyol' },
  { id: 2859,  name: 'Getafe' },
  { id: 2825,  name: 'Athletic Club' },
  { id: 2820,  name: 'Osasuna' },
  { id: 24264, name: 'Girona FC' },
  { id: 2818,  name: 'Rayo Vallecano' },
  { id: 2828,  name: 'Valencia' },
  { id: 2833,  name: 'Sevilla' },
  { id: 2826,  name: 'Mallorca' },
  { id: 2885,  name: 'Deportivo Alavés' },
  { id: 2846,  name: 'Elche' },
  { id: 2849,  name: 'Levante UD' },
  { id: 2851,  name: 'Real Oviedo' },
];

/**
 * SofaScore unique tournament IDs to track.
 * Any event whose tournament is NOT in this map is ignored.
 * Add new IDs here to extend coverage.
 */
const TRACKED_TOURNAMENTS = {
  8:     'La Liga',
  329:   'Copa del Rey',
  7:     'UEFA Champions League',
  679:   'UEFA Europa League',
  17015: 'UEFA Conference League',
  11513: 'Supercopa de España',
};

module.exports = { TEAMS, TRACKED_TOURNAMENTS };
