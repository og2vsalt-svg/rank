# rankvault

Private file hosting with specialized desks and a living library.

Drop local files. They upload to Supabase storage and public_shares. Optional notes land in whispers. Every share link (`/s/:id`) carries a polished Discord embed via middleware and `/api/shelf` (HTML escaping fixed for clean unfurls).

Soft size warnings only — never hard limits. Apple-style spring animations on frosted glass. Human-crafted UI.

**Central experience: Drop** — clean multi-file drop with shared note, per-item notes, live previews, soft size warnings only, Apple-style springs, polished Discord embeds. Accessible at `/drop`.

**Twilight Desk** at `/twilight` — drop a local file or photo, choose a cool indigo accent color, add a quiet caption, and publish a permanent share with polished Discord embeds. Soft size warnings only. Apple-style springs.

**Sunrise Desk** at `/sunrise` — drop a local file or photo, choose a warm accent color, add a quiet caption, and publish a permanent share with polished Discord embeds. Soft size warnings only. Apple-style springs.

**Countdown** at `/countdown` — set a quiet future moment, add a note or image, and share a living countdown that ticks on the share page. Soft size warnings only. Polished Discord embeds. Apple-style springs.

**Link Desk** at `/linkdesk` — collect quiet links with titles and notes. Publish them as a permanent markdown share with polished Discord embeds. Soft warnings only.

**Focus Desk** at `/focus` — set a soft timer, write a quiet note while it runs, and publish the note as a permanent markdown share with polished Discord embeds. Soft size warnings only. Apple-style springs.

**Recipe** at `/recipe` — title, ingredients, instructions, and optional photo. Publishes as a permanent share with polished Discord embeds. Soft size warnings only. Apple-style springs.

**Journal** at `/journal` — date an entry, write freely, optionally attach a photo or file, and publish as a permanent share with polished Discord embeds. Soft size warnings only. Apple-style springs.

**Gradient** at `/gradient` — compose a linear gradient with live preview and publish the image as a permanent share with polished Discord embeds. Soft size warnings only. Apple-style springs.

**Capture** at `/capture` — use your camera to take a photo and publish it as a permanent share with polished Discord embeds. Soft size warnings only. Apple-style springs.

**Markdown Desk** at `/markdowndesk` — write markdown in a quiet editor and publish it as a shareable file with polished Discord embeds. Soft size warnings only.

**Voice Memo** at `/voicememo` — record an audio note and share it as a permanent link with polished Discord embeds. Soft size warnings only. Apple-style springs.

**Sketch Desk** at `/sketch` — draw on a quiet canvas, publish the image as a permanent share with polished Discord embeds. Soft size warnings only. Apple-style springs.

**Polaroid Desk** at `/polaroiddesk` — drop a photo, add a short caption, and publish a classic polaroid frame as a permanent share with polished Discord embeds. Soft size warnings only. Apple-style springs.

**Echo Desk** at `/echodesk` — leave a quiet text note, optionally attach a local file, and publish as a permanent share with polished Discord embeds. Soft size warnings only. Apple-style springs.

**Story Desk** at `/storydesk` — write multi-section narratives that become a single markdown share with polished Discord embeds. Soft size warnings only. Apple-style springs.

**Explore** at `/explore` — visual explorer of public shares with search, type filters, and sorts (recent/size/views). Apple-style springs, polished Discord embeds. Soft warnings only.

**Moment Desk** at `/moment` — share a quiet thought, an image, or both as a single permanent link. Live preview, soft size warnings only, Apple-style springs, polished Discord embeds.

**Collage Desk** at `/collage` — drop a few images, arrange them into a simple grid, and publish the composition as a permanent share with polished Discord embeds. Soft size warnings only.

**Chroma Desk** at `/chroma` — compose color palettes, render a clean image, and publish it as a permanent share with polished Discord embeds. Soft size warnings only.

**Snippet Desk** at `/snippet` — paste code or text with language selection. Becomes a shareable file with polished Discord embeds. Soft size warnings only.

**Note Studio** at `/notestudio` — write quiet text notes that become shareable files with polished Discord embeds.

**QR Desk** at `/qrdesk` — generate real QR codes from any link and publish them as permanent shares.

**Quote Desk** at `/quotedesk` — paste a quote with optional author and accent color. Publishes as a permanent text share with polished Discord embeds. Soft size warnings only. Apple-style springs.

**Color Study** at `/colorstudy` — compose a four-color palette, name it, and publish as a permanent share with polished Discord embeds. Soft size warnings only. Apple-style springs.

**Library** at `/library` — calm browser for all public shares with search and type filters. Same soft warnings, same embeds, same prior desks intact.

**Gallery** and **Pulse** provide additional quiet views of recent activity.

All prior desks remain fully intact (QuietVault, AetherVault, Stillpoint, Weave, Horizon, Lumen Fold, and the full constellation).

## Stack

- Vite + React + Tailwind + Framer Motion
- Supabase (public_shares, whispers, storage)
- Vercel (serverless APIs, Blob optional)
- Discord / social embeds on all share links (HTML escaping repaired)

No boosting. Just quiet, reliable file hosting and notes.
