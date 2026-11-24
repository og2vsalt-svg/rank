# rankvault

Private file hosting and quiet creative desks.

Drop local files. Soft size warnings only — no hard limits. Every share link ships with polished Discord embeds.

Built with Vite, React, Tailwind, Framer Motion. Apple-style springs and frosted glass throughout. Human-crafted UI.

## Features
- **Central Drop**: multi-file hosting desk that cascades permanent shares with shared caption and accent. Recent shares grid included.
- **Cascade Desk**: multi-file cascade under one shared title, caption, and accent color. Instant Discord-ready links.
- **Orbit Map**: place a central idea, let thoughts orbit, publish the whole map as clean markdown with embeds.
- **Ribbon Desk**: focused single-file share with a quiet note and soft accent.
- Central Drop and Forge desks for crafting polished shares (title, caption, accent) from local files uploaded to Supabase (public_shares + storage)
- New Aurora Path: build a short sequence of titles and notes, publish the whole path as a clean markdown share
- New Studio desk: focused one-file drop with title, caption, accent color, and instant Discord-ready share link
- New Aureate Forge for warm, gilded single-file shares
- Harbor, Studio, Prism, Quill, Glimmer, Ember, Pulse and dozens of specialized desks
- Signature Desk, Mood Board, Whisper Note, Annotate Desk, Pixel Desk, Quote Card, Harmony Desk, Lumen Note, Particle Desk, and more
- Living library, gallery, explore, journal, sketch, gradient, QR, snippets
- Soft warnings for large files (browser may feel slow; nothing is blocked)
- Discord / social embeds on every link via API routes (proper HTML escaping)
- Local vault with IndexedDB + cloud publish
- No boosting, no artificial caps, no file size limits beyond practical browser performance notes

Deployed on Vercel. Supabase for the share database. File sharing uploads local files to the DB/storage and returns a clean share URL with embeds.

## Local
```bash
npm install
npm run dev
```

Environment: copy `.env.example` and set VITE_SUPABASE_* if you want a different project. The public anon key is already wired for the live table.

New desks and surfaces can be added as *Page.tsx components — they are automatically routed. Prior features remain intact.
