# Carb Counter API

Photo in, structured meal geometry out, then USDA carbohydrate math in code.
No ffmpeg. No video.

## Run locally

```sh
npm install
npm run server
```

Required:

- Node.js 20+
- `OPENAI_API_KEY` (same key the old picture app used)

Optional:

- `FDC_API_KEY` from USDA FoodData Central (`DEMO_KEY` is the fallback)
- `ANALYSIS_SIGNING_SECRET` in production

The phone app defaults to the existing Replit origin. After this server is
deployed there, `GET /api/health` should return `{ "ok": true, "mode": "photo" }`.
