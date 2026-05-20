# Airbnb Price Intelligence Platform

A portfolio-grade web app for the **NYC Airbnb nightly price prediction** project — a
40-model stacked ML ensemble that scored **MAE = 36.18291** on the Kaggle public
leaderboard.

Built with Next.js 14, TypeScript, Tailwind CSS, Recharts and Framer Motion. Dark,
minimal, Linear/Vercel-style design. Ships as a fully static site.

## Pages

| Route          | What it does |
|----------------|--------------|
| `/`            | Landing — hero, animated stat cards, model-evolution timeline |
| `/predict`     | Interactive price tool — instant estimate, confidence band, driver breakdown |
| `/dashboard`   | Market dashboard — borough heatmap, distributions, per-tier error analysis |
| `/methodology` | The full pipeline, feature groups, 40-model architecture, key techniques |

## Develop

```bash
npm install
npm run dev      # http://localhost:3000
```

## Build & deploy

```bash
npm run build    # static export → ./out
```

The `out/` directory is a static site — deploy it to Vercel, Netlify, GitHub Pages,
Cloudflare Pages or any static host. No server required.

## Notes

- All project numbers (MAE, model counts, feature counts, OOF trajectory, per-tier
  errors) are sourced from `TECHNICAL_SUMMARY.md`.
- The `/predict` tool uses a transparent heuristic engine calibrated to the ensemble's
  learned feature effects — the full 40-model pipeline runs offline. Neighborhood and
  market figures are realistic illustrative values.

## Stack

`Next.js 14` · `TypeScript` · `Tailwind CSS` · `Recharts` · `Framer Motion`
