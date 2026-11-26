# rankvault

Private file hosting and quiet creative desks.

Drop local files. Soft size warnings only — no hard limits. Every share link ships with polished Discord embeds.

Built with Vite, React, Tailwind, Framer Motion. Apple-style springs and frosted glass throughout. Human-crafted UI.

## Core
- **Harbor Drop**: sleek multi-file drop zone with live progress, soft size warnings, and instant Discord-ready share links. Uploads local files straight to the share database.
- **Vault Pulse**: multi-file hosting with live progress. Each local file uploads to the share database and becomes its own permanent Discord-ready link. Soft size warnings only.
- **Lumen Collection**: gather notes and local files into one board, then publish the whole collection as a clean markdown share.
- **Discord Studio**: shape title and caption for the embed, preview it, then publish a professional share link.
- Studio, Drop, Gallery, Library, and dozens of specialized desks remain fully intact.

## Features
- File sharing that uploads a local file to the Supabase database / storage and returns a clean share URL
- Professional Discord / social embeds on every link via API routes
- Soft warnings for large files (browser may feel slow; nothing is blocked)
- Local vault with IndexedDB + cloud publish
- No boosting, no artificial caps, no file size limits beyond practical browser performance notes
- New pages appear automatically when named *Page.tsx; prior features stay

Deployed on Vercel. Supabase for the share database.

## Local
```bash
npm install
npm run dev
```

Environment: copy `.env.example` and set VITE_SUPABASE_* if you want a different project. The public anon key is already wired for the live table.

New desks and surfaces can be added as *Page.tsx components — they are automatically routed. Prior features remain intact.
