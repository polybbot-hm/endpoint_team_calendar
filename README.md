# La Liga Calendar API

API para consultar calendario de partidos por equipo (competiciones activas) con datos ingestados desde SofaScore y almacenados en Supabase.

## Caracteristicas

- Soporta varias temporadas (ya no depende de `2025/26` hardcodeado).
- Permite filtrar por temporada en endpoints de lectura.
- Incluye endpoint de documentacion en runtime.

## Requisitos

- Node.js 18+
- Variables de entorno:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `CALENDAR_TABLE` (opcional, default: `liga_calendar`)

## Instalacion

```bash
npm install
```

## Ejecucion

```bash
npm run dev
```

o en produccion:

```bash
npm start
```

## Despliegue en Railway

El proyecto ya esta preparado para Railway con:

- `railway.toml` con build/deploy configurado
- `startCommand = "npm start"`

Variables de entorno que debes configurar en Railway:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `CALENDAR_TABLE` (opcional)

Si quieres restringir ingesta manual en produccion, protege `POST /ingest` y `POST /ingest/team` antes de exponer los endpoints.

### Cron semanal en Railway (recomendado)

Configura un cron job en Railway para llamar el endpoint de ingesta completa cada fin de semana.

- Metodo: `POST`
- URL: `https://TU-DOMINIO-RAILWAY/ingest`
- Body: `{}` (o `{"season":"25-26"}`)
- Cron (domingo 03:00 UTC): `0 3 * * 0`

Tambien puedes pasar temporada por query:

- `POST https://TU-DOMINIO-RAILWAY/ingest?season=25-26`

## Ingesta de datos

Ingesta completa (todas las temporadas disponibles en el feed):

```bash
npm run ingest
```

Ingesta filtrada por temporada:

```bash
INGEST_SEASON=25-26 npm run ingest
```

Ingesta manual por API para todos los equipos (inserta nuevos partidos y actualiza existentes):

```bash
curl -X POST http://localhost:3000/ingest \
  -H "Content-Type: application/json" \
  -d '{"season":"25-26"}'
```

Ingesta manual por API para un solo equipo (inserta/actualiza en la tabla configurada):

```bash
curl -X POST http://localhost:3000/ingest/team \
  -H "Content-Type: application/json" \
  -d '{"team":"Barcelona","season":"25-26"}'
```

Formatos validos para `season`:

- `YYYY/YY` (ej: `2025/26`)
- `YYYY-YY` (ej: `2025-26`)
- `YY/YY` (ej: `25/26`)
- `YY-YY` (ej: `25-26`)

## Equipos soportados (nombre exacto)

Usa estos nombres exactos cuando quieras referenciar equipos en ingesta por equipo:

- `Barcelona` (2817)
- `Real Madrid` (2829)
- `Atlético Madrid` (2836)
- `Villarreal` (2819)
- `Real Betis` (2816)
- `Celta Vigo` (2821)
- `Real Sociedad` (2824)
- `Espanyol` (2814)
- `Getafe` (2859)
- `Athletic Club` (2825)
- `Osasuna` (2820)
- `Girona FC` (24264)
- `Rayo Vallecano` (2818)
- `Valencia` (2828)
- `Sevilla` (2833)
- `Mallorca` (2826)
- `Deportivo Alavés` (2885)
- `Elche` (2846)
- `Levante UD` (2849)
- `Real Oviedo` (2851)

## Endpoints

### `GET /calendar`

Devuelve todos los partidos del equipo en competiciones activas.

Query params:

- `team` (required): nombre del equipo (match parcial, case-insensitive)
- `season` (optional): filtra por temporada

Ejemplos:

- `/calendar?team=Barcelona`
- `/calendar?team=Barcelona&season=25-26`

### `GET /calendar/around`

Devuelve el partido anterior y siguiente alrededor de una fecha.

Query params:

- `team` (required)
- `date` (required): `YYYY-MM-DD`
- `season` (optional)

Ejemplos:

- `/calendar/around?team=Barcelona&date=2026-03-16`
- `/calendar/around?team=Barcelona&date=2026-03-16&season=25-26`

### `GET /docs`

Devuelve documentacion de la API en JSON.

### `GET /health`

Healthcheck simple para monitorizacion.

### `POST /ingest/team`

Ejecuta ingesta manual de un equipo y hace upsert en la tabla configurada (`CALENDAR_TABLE` o `liga_calendar` por defecto).

Body:

- `team` (optional si envias `team_id`)
- `team_id` (optional si envias `team`)
- `season` (optional)

### `POST /ingest`

Ejecuta ingesta manual de todos los equipos trackeados y hace upsert en la tabla configurada.

Query/Body:

- `season` (optional)

### `GET /docs/readme`

Devuelve este README en `text/markdown`.

### `GET /docs/openapi`

Devuelve la especificacion OpenAPI 3.0 en formato JSON.

### `GET /docs/ui`

Devuelve Swagger UI para explorar y probar la API desde navegador.

