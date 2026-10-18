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

- `/softprism` — soft prismatic light shards for what you carry. Multi-file drop with a shared note and accent color, gentle refracting diamond shards that rotate, shimmer, and breathe with your color, spring motion, glass surfaces, polished Discord embeds. Each file lands in storage and the public_shares table. Large files warned, never refused. Prior features preserved. No traces of boosting.
- `/publicledger` — public ledger of shares. Browse recent public drops already filed. Leave a pure text note that travels alone (no file required). Lands in the public_shares table with polished Discord embeds. Soft Apple-style spring motion and glass surfaces. Large notes warned only for possible slowness. No hard limits. Prior desks preserved. No traces of boosting.
- `/softnebula` — soft drifting nebula clouds for what you carry. Multi-file drop with a shared note and accent color, quiet expanding clouds of light that breathe and drift with your color, spring motion, glass surfaces, polished Discord embeds. Each file lands in storage and the public_shares table. Large files warned, never refused. Prior features preserved. No traces of boosting.

All prior desks remain fully functional. New pages auto-route via the glob loader. Discord embeds apply to every link through the existing rewrite rules and embed handler.
