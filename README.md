# rankvault

Private file hosting and quiet creative desks.

Drop local files. Soft size warnings only — no hard limits. Every share link ships with polished Discord embeds.

Built with Vite, React, Tailwind, Framer Motion. Apple-style springs and frosted glass throughout. Human-crafted UI.

## Features
- Central Drop, Harbor, Studio, Prism, Quill, Glimmer, Ember, Pulse and dozens of specialized desks for uploading local files straight to Supabase (public_shares + storage)
- Annotate Desk: drop an image, draw marks over it, add a caption, and publish the annotated result as a permanent share
- Pixel Desk: paint a 16×16 grid, choose colors, and publish the pixel art as a permanent share
- Quote Card: type a quote and attribution, preview a typographic card, and publish it as a permanent share
- Harmony Desk: generate analogous, complementary, or triadic palettes from a seed color and publish the set as a permanent share
- Living library, gallery, explore, journal, sketch, gradient, QR, snippets, and more
- Soft warnings for large files (browser may feel slow; nothing is blocked)
- Discord / social embeds on every link via API routes and middleware-style handling (proper HTML escaping)
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
