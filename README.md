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
  - `CALENDAR_TABLE` (opcional, default: `calendar`)

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

## Despliegue en Vercel

El proyecto ya esta preparado para Vercel con:

- `api/index.js` como entrypoint serverless
- `vercel.json` con rewrite global para mantener rutas limpias (`/calendar`, `/docs`, etc.)

Variables de entorno que debes configurar en Vercel:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `CALENDAR_TABLE` (opcional)

Si quieres restringir ingesta manual en produccion, protege `POST /ingest/team` antes de exponer el endpoint.

## Ingesta de datos

Ingesta completa (todas las temporadas disponibles en el feed):

```bash
npm run ingest
```

Ingesta filtrada por temporada:

```bash
INGEST_SEASON=25-26 npm run ingest
```

Ingesta manual por API para un solo equipo (inserta/actualiza en la tabla configurada):

```bash
curl -X POST http://localhost:3000/ingest/team \
  -H "Content-Type: application/json" \
  -d '{"team":"barcelona","season":"25-26"}'
```

Formatos validos para `season`:

- `YYYY/YY` (ej: `2025/26`)
- `YYYY-YY` (ej: `2025-26`)
- `YY/YY` (ej: `25/26`)
- `YY-YY` (ej: `25-26`)

## Endpoints

### `GET /calendar`

Devuelve todos los partidos del equipo en competiciones activas.

Query params:

- `team` (required): nombre del equipo (match parcial, case-insensitive)
- `season` (optional): filtra por temporada

Ejemplos:

- `/calendar?team=barcelona`
- `/calendar?team=barcelona&season=25-26`

### `GET /calendar/around`

Devuelve el partido anterior y siguiente alrededor de una fecha.

Query params:

- `team` (required)
- `date` (required): `YYYY-MM-DD`
- `season` (optional)

Ejemplos:

- `/calendar/around?team=barcelona&date=2026-03-16`
- `/calendar/around?team=barcelona&date=2026-03-16&season=25-26`

### `GET /docs`

Devuelve documentacion de la API en JSON.

### `POST /ingest/team`

Ejecuta ingesta manual de un equipo y hace upsert en la tabla configurada (`CALENDAR_TABLE` o `calendar` por defecto).

Body:

- `team` (optional si envias `team_id`)
- `team_id` (optional si envias `team`)
- `season` (optional)

### `GET /docs/readme`

Devuelve este README en `text/markdown`.

### `GET /docs/openapi`

Devuelve la especificacion OpenAPI 3.0 en formato JSON.

### `GET /docs/ui`

Devuelve Swagger UI para explorar y probar la API desde navegador.

