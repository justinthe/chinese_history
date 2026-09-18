# Middle Kingdom Explorer

Static single-page site: ~4,000 years of Chinese history on one screen —
timeline, morphing map, event cards, Grand Tour. No backend, no accounts.
See `PRD.md` and `architecture.md` for the full spec.

## Run it

```
docker compose up -d --wait
```

or, without Docker:

```
npm ci
npm run dev -- --host
```

Then open http://localhost:5173/chinese_history/.

## Scripts

| Script | Does |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Validate content, then build `dist/` |
| `npm run validate` | Content schema and reference checks |
| `npm test` | Run vitest unit tests |
| `npm run e2e` | Build, preview, and run Playwright smoke tests |
| `npm run screens` | Regenerate storyboard screenshots from `mockup.html` |
