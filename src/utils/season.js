'use strict';

/**
 * Normaliza una temporada al formato canónico "YYYY/YY".
 *
 * Ejemplos aceptados:
 * - 2025/26
 * - 2025-26
 * - 2025/2026
 * - 25/26
 * - 25-26
 *
 * @param {string|undefined|null} value
 * @returns {string|null}
 */
function normalizeSeason(value) {
  if (value == null) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  let m = raw.match(/^(\d{4})[/-](\d{2})$/);
  if (m) return `${m[1]}/${m[2]}`;

  m = raw.match(/^(\d{4})[/-](\d{4})$/);
  if (m) return `${m[1]}/${m[2].slice(-2)}`;

  m = raw.match(/^(\d{2})[/-](\d{2})$/);
  if (m) {
    const startYear = 2000 + Number(m[1]);
    return `${startYear}/${m[2]}`;
  }

  m = raw.match(/^(\d{4})$/);
  if (m) {
    const startYear = Number(m[1]);
    const endShort = String((startYear + 1) % 100).padStart(2, '0');
    return `${startYear}/${endShort}`;
  }

  return null;
}

/**
 * Construye la temporada esperada para una fecha.
 * El corte de temporada se asume en julio (pretemporada/verano europeo).
 *
 * @param {Date} date
 * @returns {string}
 */
function seasonFromDate(date) {
  const startYear = date.getUTCMonth() >= 6 ? date.getUTCFullYear() : date.getUTCFullYear() - 1;
  const endShort = String((startYear + 1) % 100).padStart(2, '0');
  return `${startYear}/${endShort}`;
}

module.exports = { normalizeSeason, seasonFromDate };
