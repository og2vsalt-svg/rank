# rankvault

Private file hosting and sharing, built as a collection of quiet desks.

## Core

- Local vault that never leaves the browser until you choose to share
- Uploads land in Supabase storage + the public_shares table (and specialized tables for each desk)
- Professional Discord / social embeds on every share link via user-agent rewrites and OG cards
- No hard file size limits — only soft warnings when a drop may feel slow
- Apple-style glass, spring animations, and human-crafted pacing
- Dozens of specialized desks that each treat a file or note differently

Live: https://rank-six-iota.vercel.app/

## Recent desks

- `/candela` — notes and file drops with spring animations
- `/lumen` — public share gallery
- `/prism` — visual mosaic of images (local play)
- `/cascade` — sequential multi-file drops with accents
- `/meridian` — one quiet drop with a time note
- `/nexus`, `/horizon`, `/dock` and many more — each keeps prior features intact

Every new desk keeps the older ones. File sharing always writes to the database. Embeds stay polished. Large files are warned, never refused.
