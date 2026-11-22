# rankvault

Private file hosting with dozens of specialized desks.

Drop local files. They upload to Supabase storage and public_shares. Optional notes land in whispers. Every share link (`/s/:id`) carries a polished Discord embed via middleware and `/api/shelf` (HTML escaping fixed for clean unfurls).

Soft size warnings only — never hard limits. Apple-style spring animations on frosted glass. Human-crafted UI.

**Central experience: Drop** — clean multi-file drop with shared note, per-item notes, live previews, soft size warnings only, Apple-style springs, polished Discord embeds. Accessible at `/drop`.

New desk: **Meridian** at `/meridian` — quiet center multi-file drop with rising meridian line, shared and per-file notes, live previews, soft size warnings only, and refined Apple-style spring animations. Discord embeds polished on every share.

New desk: **Horizon** at `/horizon` — wide calm multi-file drop with rising horizon line, shared and per-file notes, live previews, soft size warnings only, and refined Apple-style spring animations. Discord embeds polished on every share.

New desk: **Gloaming** at `/gloaming` — twilight multi-file drop with soft dusk gradient, shared and per-file notes, live previews, soft size warnings only, and refined Apple-style spring animations. Discord embeds polished on every share.

New desk: **LumenCore** at `/lumencore` — quiet light multi-file drop with shared caption, per-item notes, live previews, soft size warnings only, and refined Apple-style spring animations. Discord embeds polished on every share.

New desk: **Aurora** at `/aurora` — flowing light drop with shifting gradient aurora, shared and per-file notes, live previews, soft size warnings only, and refined Apple-style spring animations. Discord embeds polished on every share.

New desk: **Zenith** at `/zenith` — highest point drop with rising motion, shared and per-file notes, live previews, soft size warnings only, and refined Apple-style spring animations. Discord embeds polished on every share.

Prior desk: **Stillwater** at `/stillwater` — quiet surface drop with gentle wave motion, shared and per-file notes, live previews, soft size warnings only, and refined Apple-style spring animations. Discord embeds polished on every share.

Prior desk: **Prism** at `/prism` — multi-file grid with live image previews, per-item notes, shared caption, soft size warnings only, and refined Apple-style spring animations. Discord embeds polished on every share.

Prior desk: **LumenOrbit** at `/lumenorbit` — circular multi-file orbit with shared caption, per-item notes, soft glow, and live previews.

All prior desks remain fully intact (QuietVault, AetherVault, Stillpoint, Weave, and the full constellation).

## Stack

- Vite + React + Tailwind + Framer Motion
- Supabase (public_shares, whispers, storage)
- Vercel (serverless APIs, Blob optional)
- Discord / social embeds on all share links (HTML escaping repaired)

No boosting. Just quiet, reliable file hosting and notes.
