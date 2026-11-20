# rankvault

Private file hosting with dozens of specialized desks.

Drop local files. They upload to Supabase storage and public_shares. Optional notes land in whispers. Every share link (`/s/:id`) carries a polished Discord embed via middleware and `/api/shelf` (HTML escaping fixed for clean unfurls).

Soft size warnings only — never hard limits. Apple-style spring animations on frosted glass. Human-crafted UI.

Desks include Core, Solace (file + quiet note), Quill (pure writing desk with optional file), Bundle (group multiple files into one collection), Prism (per-file accent colors for embeds), Horizon (calm line of recent shares), Notebook (text notes), Gallery, Timeline, Quiet Notes, Quiet Harbor, Quiet Signal, Quiet Inspector, Lens, Diary, Sketch, Pulse and many more. All prior desks remain fully intact.

## Stack

- Vite + React + Tailwind + Framer Motion
- Supabase (public_shares, whispers, storage)
- Vercel (serverless APIs, Blob optional)
- Discord / social embeds on all share links

No boosting. Just quiet, reliable file sharing and notes.
