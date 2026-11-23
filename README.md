# rankvault

Private file hosting with specialized desks and a living library.

Drop local files. They upload to Supabase storage and public_shares. Optional notes land in whispers. Every share link (`/s/:id`) carries a polished Discord embed via middleware and `/api/shelf` (HTML escaping fixed for clean unfurls).

Soft size warnings only — never hard limits. Apple-style spring animations on frosted glass. Human-crafted UI.

**Central experience: Drop** — clean multi-file drop with shared note, per-item notes, live previews, soft size warnings only, Apple-style springs, polished Discord embeds. Accessible at `/drop`.

**New: Moment Desk** at `/moment` — share a quiet thought, an image, or both as a single permanent link. Live preview, soft size warnings only, Apple-style springs, polished Discord embeds.

**Collage Desk** at `/collage` — drop a few images, arrange them into a simple grid, and publish the composition as a permanent share with polished Discord embeds. Soft size warnings only.

**Chroma Desk** at `/chroma` — compose color palettes, render a clean image, and publish it as a permanent share with polished Discord embeds. Soft size warnings only.

**Snippet Desk** at `/snippet` — paste code or text with language selection. Becomes a shareable file with polished Discord embeds. Soft size warnings only.

**Note Studio** at `/notestudio` — write quiet text notes that become shareable files with polished Discord embeds.

**QR Desk** at `/qrdesk` — generate real QR codes from any link and publish them as permanent shares.

**Library** at `/library` — calm browser for all public shares with search and type filters. Same soft warnings, same embeds, same prior desks intact.

All prior desks remain fully intact (QuietVault, AetherVault, Stillpoint, Weave, Horizon, Lumen Fold, and the full constellation).

## Stack

- Vite + React + Tailwind + Framer Motion
- Supabase (public_shares, whispers, storage)
- Vercel (serverless APIs, Blob optional)
- Discord / social embeds on all share links (HTML escaping repaired)

No boosting. Just quiet, reliable file hosting and notes.
