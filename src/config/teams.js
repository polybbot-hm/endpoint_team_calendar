'use strict';

/**
 * La Liga 2024/2025 teams with their SofaScore team IDs.
 * Slug is used for logging only.
 */
const TEAMS = [
  { id: 2817,  name: 'Barcelona'   },
  { id: 2829,  name: 'Real Madrid' },
  { id: 2836,  name: 'Ath Madrid'  },
  { id: 2833,  name: 'Sociedad'    },
  { id: 2828,  name: 'Ath Bilbao'  },
  { id: 2820,  name: 'Villarreal'  },
  { id: 2818,  name: 'Betis'       },
  { id: 2826,  name: 'Sevilla'     },
  { id: 2821,  name: 'Mallorca'    },
  { id: 2862,  name: 'Girona'      },
  { id: 2835,  name: 'Celta'       },
  { id: 2931,  name: 'Alaves'      },
  { id: 2823,  name: 'Vallecano'   },
  { id: 2827,  name: 'Las Palmas'  },
  { id: 2816,  name: 'Osasuna'     },
  { id: 2860,  name: 'Getafe'      },
  { id: 2858,  name: 'Valencia'    },
  { id: 2830,  name: 'Espanol'     },
  { id: 2953,  name: 'Valladolid'  },
  { id: 2840,  name: 'Leganes'     },
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
