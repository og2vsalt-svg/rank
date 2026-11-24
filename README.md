# rankvault

Private file hosting and quiet creative desks.

Drop local files. Soft size warnings only — no hard limits. Every share link ships with polished Discord embeds.

Built with Vite, React, Tailwind, Framer Motion. Apple-style springs and frosted glass throughout. Human-crafted UI.

## Features
- Central Drop, Harbor, and Studio desks for uploading local files straight to Supabase (public_shares + storage)
- Annotate Desk: drop an image, draw marks over it, add a caption, and publish the annotated result as a permanent share
- Prism Desk: drop one or many local files with a shared note and accent. Recent public drops settle into a living prism of glass tiles with spring motion
- Board desk: freeform pinboard for notes and files that publishes as one share
- Wave desk: drop an audio file, watch a living spectrum visualization, and publish with a quiet caption
- Insights desk: quiet numbers on recent public shares (types, sizes, arrivals)
- Living library, gallery, explore, journal, sketch, gradient, QR, snippets, and dozens of specialized desks
- Soft warnings for large files (browser may feel slow; nothing is blocked)
- Discord / social embeds on every link via middleware rewrites + /api/shelf (proper HTML escaping)
- Local vault with IndexedDB + cloud publish
- No boosting, no artificial caps

Deployed on Vercel. Supabase for the share database.

## Local
```bash
npm install
npm run dev
```

Environment: copy `.env.example` and set VITE_SUPABASE_* if you want a different project. The public anon key is already wired for the live table.
