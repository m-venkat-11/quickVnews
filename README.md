# PRISM CURRENT

**Understand what matters.**

AI-powered personal current-affairs & intelligence dashboard for UPSC, APPSC and
government-exam aspirants. News → AI → Context → Exam Relevance → Revision.

```
┌────────────────────────────────────────────────────────────────┐
│  RSS / official sources → ingest → dedupe → classify → score   │
│      → summarize (LLM optional) → store → brief → dashboard    │
└────────────────────────────────────────────────────────────────┘
```

## Quick start

```bash
npm install
npm run db:init        # schema + seed + first demo cycle (offline, safe)
npm run dev            # http://localhost:3210
```

Everything runs with **zero API keys**. The app boots in demo mode with clearly
labelled `SAMPLE` content and never invents "live" news.

## Going live

1. Run `npm run ingest -- --live` (or `POST /api/cron` with `Authorization: Bearer $CRON_SECRET`).
   Real RSS sources are fetched, deduped, classified and stored.
2. If sources are unreachable, the cycle falls back to a labelled demo cycle —
   the UI keeps telling the truth about what it is showing.
3. Set `AI_API_KEY` (any OpenAI-compatible endpoint) to enable LLM summarization.
   Without it, a deterministic extractive pipeline runs — scoring, classification,
   GS-tagging and dedupe all still work.

## 6-hour schedule (00:00 / 06:00 / 12:00 / 18:00 IST)

The dashboard always computes *last update* / *next update* from the DB — it is
never faked in frontend JavaScript. Pick one scheduler:

**GitHub Actions (free)**
```yaml
# .github/workflows/ingest.yml
name: ingest
on:
  schedule: [{ cron: "30 0,6,12,18 * * *" }]  # 00/06/12/18 IST
  workflow_dispatch: {}
jobs:
  ingest:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 24 }
      - run: npm ci
      - run: npm run db:init
      - run: node scripts/ingest-once.mjs --live
      # commit data/prism.db or push to your host's volume
```

**cron (VPS / always-on host)**
```
30 0,6,12,18 * * * curl -fsS -X POST -H "Authorization: Bearer $CRON_SECRET" https://your-host/api/cron
```

**cli**
```
npm run cron:tick        # hits /api/cron using PRISM_BASE_URL + CRON_SECRET
```

## Architecture

```
src/
  app/                 # Next.js App Router pages + API routes
    api/{articles,bookmarks,settings,cron}/
    article/[id]/      # detail page
    topic/[slug]/      # 13 topic pages incl. geopolitics map + Vizag module
    brief/ search/ upsc/ revision/ bookmarks/ facts/ tools/ settings/ admin/
  components/          # shell, article, facts, revision, settings, admin, pwa
  lib/
    ai/                # provider (optional LLM), classify, concepts, processor
    db/                # node:sqlite schema, queries, seed
    news/              # sources catalog, rss parser, ingest engine, demo
    utils/             # time (IST), text, scoring
scripts/               # init-db, ingest-once, cron-tick, reset-db + alias loader
data/prism.db          # SQLite (WAL) — swap with any store via lib/db
```

### Key design decisions

- **node:sqlite** (Node ≥22.5) — zero native deps, no DB service to pay for.
- **Source tiers**: 1 = official (PIB, RBI, ISRO, ECI…), 2 = reputable, 3 = general.
  Tier feeds the importance score; official sources get a confidence boost.
- **Dedupe**: URL hash (unique index) + title-similarity clustering against the
  last 72h; duplicates fold into the surviving article as extra sources.
- **Importance score** (0–100): category weight + recency + source quality +
  exam relevance + breadth. Not popularity.
- **Static-concept engine**: transparent rule mapping from news to GS papers,
  concepts and prelims facts — explainable, nothing fabricated.
- **Political neutrality**: claims are attributed, never asserted. Confidence
  labels (`official / multi-source / developing / reports-differ`) are honest —
  no fake "100% verified" badges.
- **Demo safety**: sample rows carry `is_demo=1`, render a SAMPLE badge, and
  demo headlines literally begin with "Sample briefing".

## Environment (all optional)

See `.env.example`. Notables: `AI_API_KEY`, `AI_API_BASE_URL`, `AI_MODEL`,
`CRON_SECRET`, `ADMIN_ALLOWED_IPS`, `PRISM_DB_PATH`.

## Admin

`/admin` (loopback IPs by default, extend via `ADMIN_ALLOWED_IPS`): run stats,
duplicates, failures, source health, manual cycle trigger.

## PWA

Manifest + service worker (network-first, cache fallback, offline page).
Install from the browser menu; the latest briefing is available offline.
