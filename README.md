# rankvault

Private file hosting and quiet creative desks. Centralized around effortless file sharing.

Drop local files. Soft size warnings only — no hard limits. Every share link ships with polished Discord embeds.

Built with Vite, React, Tailwind, Framer Motion. Apple-style springs and frosted glass throughout. Human-crafted UI.

## New desks
- **Silk Board**: drop local files onto a living board. Each settles with staggered Apple-style springs and becomes its own permanent Discord-ready link under a shared title, caption, and accent. Soft size warnings only. Prior desks remain untouched.
- **Aether Stream**: build a living sequence step by step. Drop files (with optional per-step notes), choose accent, and each becomes its own permanent Discord-ready link. Soft size warnings only. Apple-style springs on frosted glass. Prior desks remain untouched.
- **Prism Sketch**: a living canvas. Draw freely with spring-smooth tools, then publish the sketch as a permanent Discord-ready PNG share. Soft warnings only. All prior features remain.

- **Quiet Harbor**: shape embed title, caption, and accent with live preview, then drop multiple local files. Each becomes a permanent Discord-ready link. Soft size warnings only.
- **Silk Mosaic**: weave local images into a living board. Publish each under a shared title and caption as Discord-ready shares.
- **Aether Timeline**: sequence moments with notes and optional file attachments. Publish the whole timeline as one polished markdown share.
- **Prism Code**: shape a code snippet, set Discord embed styling, and publish it as a permanent file share.

## Core
- **Aether Echo**: leave a quiet mark. Write a note, optionally attach a local file, choose an accent, and publish a permanent Discord-ready share. Soft size warnings only. Apple-style springs on frosted glass.
- **Central Prism**: the quiet center. Multi-file drops with custom title, caption, and accent, live gallery of recent shares, soft size warnings only, and instant Discord-ready links. Apple-style springs on frosted glass.
- **Prism Journal**: write a quiet note (title + body), optionally attach files, shape caption and accent, then publish permanent Discord-ready shares. Soft size warnings only. Apple-style springs on frosted glass.
- **Central Vault**: the quiet center. Drop local files; each uploads to the share database and becomes a permanent Discord-ready link with polished embeds. Soft size warnings only. Apple-style springs on frosted glass.
- **Cascade Desk**: files that fall in quiet sequence. Multi-file drops cascade into permanent Discord-ready shares with staggered springs. Soft size warnings only.
- **Mood Atlas**: map a mood with notes, colors, and local files. Each piece publishes as a polished Discord-ready share under one quiet title and caption. Soft size warnings only. Apple-style springs on frosted glass.
- **Echo Note**: write a quiet note, optionally attach a local file, shape title/caption/accent, and publish a permanent Discord-ready share. Soft size warnings only. Apple-style springs on frosted glass.
- **Horizon Forge**: shape title, caption, accent, and optional expiry, then drop multiple local files. Each uploads to the share database and becomes a permanent Discord-ready link. Soft size warnings only. Apple-style springs on frosted glass.
- **Lumen Vault**: quiet multi-file hosting with living gallery previews, soft size warnings, and instant Discord-ready share links. Uploads local files straight to the share database.
- **Lumen Drop**: refined multi-file hosting with live previews, soft size warnings, and instant Discord-ready share links. Uploads local files straight to the share database.
- **Prism Vault**: multi-file hosting with live previews, accent colors, soft size warnings, and instant Discord-ready share links. Uploads local files straight to the share database.
- **Silk Weave**: weave files into polished embeds with a shared caption. Soft warnings only.
- **Aether Forge**: shape title, caption, and accent color, then drop multiple local files. Each becomes a permanent Discord-ready share with your custom embed styling. Soft size warnings only. Apple-style springs on frosted glass.
- **Nexus Drop**: central multi-file hosting with live previews, soft size warnings, and instant Discord-ready share links. Uploads local files straight to the share database.
- **Harbor Drop**: sleek multi-file drop zone with live progress, soft size warnings, and instant Discord-ready share links. Uploads local files straight to the share database.
- **Vault Pulse**: multi-file hosting with live progress. Each local file uploads to the share database and becomes its own permanent Discord-ready link. Soft size warnings only.
- **Lumen Collection**: gather notes and local files into one board, then publish the whole collection as a clean markdown share.
- **Discord Studio**: shape title and caption for the embed, preview it, then publish a professional share link.
- **Snippet Forge**: type or paste code, shape the Discord title and caption, publish as a permanent file share with live preview. Soft warnings only.
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
