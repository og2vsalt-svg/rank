# rankvault

Private file hosting and quiet creative desks.

Drop local files. Soft size warnings only — no hard limits. Every share link ships with polished Discord embeds.

Built with Vite, React, Tailwind, Framer Motion. Apple-style springs and frosted glass throughout. Human-crafted UI.

## Features
- Central Drop and Studio desks for uploading local files straight to Supabase (public_shares + storage)
- Board desk: freeform pinboard for notes and files that publishes as one share
- Insights desk: quiet numbers on recent public shares (types, sizes, arrivals)
- Living library, gallery, explore, journal, sketch, gradient, QR, snippets, and dozens of specialized desks
- Soft warnings for large files (browser may feel slow; nothing is blocked)
- Discord / social embeds on every link via middleware rewrites + /api/shelf (fixed HTML escaping)
- Local vault with IndexedDB + cloud publish
- No boosting, no artificial caps

Deployed on Vercel. Supabase for the share database.

## Local
```bash
npm install
npm run dev
```

Environment: copy `.env.example` and set VITE_SUPABASE_* if you want a different project. The public anon key is already wired for the live table.
