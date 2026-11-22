# rankvault

Private file hosting with dozens of specialized desks.

Drop local files. They upload to Supabase storage and public_shares. Optional notes land in whispers. Every share link (`/s/:id`) carries a polished Discord embed via middleware and `/api/shelf` (HTML escaping fixed for clean unfurls).

Soft size warnings only — never hard limits. Apple-style spring animations on frosted glass. Human-crafted UI.

**Central experience: Drop** — clean multi-file drop with shared note, per-item notes, live previews, soft size warnings only, Apple-style springs, polished Discord embeds. Accessible at `/drop`.

All prior desks remain fully intact (QuietVault, AetherVault, Stillpoint, Weave, and the full constellation).

## Stack

- Vite + React + Tailwind + Framer Motion
- Supabase (public_shares, whispers, storage)
- Vercel (serverless APIs, Blob optional)
- Discord / social embeds on all share links (HTML escaping repaired)

No boosting. Just quiet, reliable file hosting and notes.
