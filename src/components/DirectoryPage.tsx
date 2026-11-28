import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';

const DESKS = [
  { route: 'silkpulse', title: 'Silk Pulse', blurb: 'A living pulse of recent public shares. Soft size notes only. Every link ships with a polished Discord embed. Apple-style springs on frosted glass. Prior desks remain untouched. No boosting.' },
  { route: 'lumenexplorer', title: 'Lumen Explorer', blurb: 'Living search and filter for recent public shares from the database. Soft size notes only. Every link ships with a polished Discord embed. Apple-style staggered springs on frosted glass. Prior desks remain untouched. No boosting.' },
  { route: 'quiethorizonstudio', title: 'Quiet Horizon Studio', blurb: 'Shape a title, caption, and accent. Drop local files. Preview the living Discord embed in real time. Publish a polished permanent share. Soft size warnings only — no hard limits, no boosting. Apple-style springs on frosted glass. Prior desks remain untouched.' },
  { route: 'prismnotebook', title: 'Prism Notebook', blurb: 'A quiet sequence of thoughts. Add entries, optionally attach local files that upload to the share database, then publish the whole notebook as one permanent Discord-ready markdown link. Soft size warnings only. No hard limits, no boosting. Apple-style springs on frosted glass. Prior desks remain untouched.' },
  { route: 'lumenecho', title: 'Lumen Echo', blurb: 'Leave a quiet mark. Drop a local file or write a note. It settles into a living echo with Apple-style springs and becomes a permanent Discord-ready link. Soft size warnings only. No hard limits, no boosting. Prior desks remain untouched.' },
  { route: 'aethercanvas', title: 'Aether Canvas', blurb: 'Draw freely on a living canvas. Export as PNG and publish a permanent Discord-ready link with title, caption, and accent. Soft size warnings only. No hard limits, no boosting. Apple-style springs on frosted glass. Prior desks remain untouched.' },
  { route: 'voicecapsule', title: 'Voice Capsule', blurb: 'Record a quiet voice note. Add title and caption. Publish a permanent Discord-ready link. Soft size warnings only. No hard limits, no boosting. Apple-style springs on frosted glass. Prior desks remain untouched.' },
  { route: 'inviteforge', title: 'Invite Forge', blurb: 'Shape an event invite with date, place, note, and optional local file. Publish a permanent Discord-ready link. Soft size warnings only. No hard limits. Apple-style springs on frosted glass.' },
  { route: 'quietchecklist', title: 'Quiet Checklist', blurb: 'Build a living checklist of items. Mark done, add a note, publish the whole list as a clean markdown share. Soft warnings only. No hard limits, no boosting. Prior desks remain untouched.' },
  { route: 'lumenpalette', title: 'Lumen Palette', blurb: 'Drop local images. A living palette settles with Apple-style springs from the light inside. Publish each as its own permanent Discord-ready link, with the colors carried in the caption. Soft size warnings only. No hard limits. Prior desks remain untouched.' },
  { route: 'aetherarchive', title: 'Aether Archive', blurb: 'Living multi-file archive. Shape a shared title, caption, and accent, then drop local files. They settle with staggered Apple-style springs and each becomes its own permanent Discord-ready link. Soft size warnings only. No hard limits. Prior desks remain untouched.' },
  { route: 'velvetdrift', title: 'Velvet Drift', blurb: 'Soft files in gentle drift. Shape a shared title, caption, and accent, then drop multiple local files. They settle with staggered Apple-style springs and each becomes its own permanent Discord-ready link. Soft size warnings only. No hard limits, no boosting. Prior desks remain untouched.' },
  { route: 'prismgallery', title: 'Prism Gallery', blurb: 'Living gallery of recent public shares from the database. Soft size notes only. Every link ships with a polished Discord embed. Apple-style springs on frosted glass. Prior desks remain untouched.' },
  { route: 'lumenboard', title: 'Lumen Board', blurb: 'Drop local files onto a living board. Each settles with staggered Apple-style springs and becomes its own permanent Discord-ready link under a shared title, caption, and accent. Soft size warnings only. No hard limits.' },
  { route: 'silkboard', title: 'Silk Board', blurb: 'Drop local files onto a living board. Each settles with staggered Apple-style springs and becomes its own permanent Discord-ready link under a shared title, caption, and accent. Soft size warnings only. No hard limits.' },
  { route: 'aetherforge', title: 'Aether Forge', blurb: 'Shape title, caption, and accent color, then drop multiple local files. Each becomes a permanent Discord-ready share with your custom embed styling. Soft size warnings only. Apple-style springs on frosted glass. No hard limits.' },
  { route: 'snippetforge', title: 'Snippet Forge', blurb: 'Type or paste code. Shape the title and caption Discord will show, then publish the snippet as a permanent file share. Live preview, soft size warnings only, Apple-style springs. No hard limits.' },
  { route: 'nexusdrop', title: 'Nexus Drop', blurb: 'Central multi-file hosting with live previews, soft size warnings only, and instant Discord-ready share links. Uploads local files straight to the share database. Apple-style springs on frosted glass. No hard limits.' },
  { route: 'lumencollection', title: 'Lumen Collection', blurb: 'Gather notes and local files into one quiet board. Publish the whole collection as a clean markdown share with permanent Discord-ready links. Soft size warnings only. No hard limits. Apple-style springs on frosted glass.' },
  { route: 'vaultpulse', title: 'Vault Pulse', blurb: 'Multi-file hosting with live progress. Each local file uploads to the share database and becomes its own permanent Discord-ready link. Soft size warnings only. No hard limits.' },
  { route: 'discordstudio', title: 'Discord Studio', blurb: 'Shape title and caption for the embed, preview it, then publish a professional share link. Soft warnings only. Polished Discord embeds.' },
  { route: 'quietdrift', title: 'Quiet Drift', blurb: 'Multi-file shares that settle in sequence with staggered Apple-style springs. Shared title, caption, and cool accent. Each becomes its own permanent Discord-ready link. Soft size warnings only. No hard limits.' },
  { route: 'aethercascade', title: 'Aether Cascade', blurb: 'Multi-file shares that cascade with staggered Apple-style springs. Shared title, caption, and violet accent. Each becomes its own permanent Discord-ready link. Soft size warnings only.' },
  { route: 'quietpath', title: 'Quiet Path', blurb: 'Shape a short sequence of titles and notes. Publish the whole path as one clean markdown share. Permanent Discord-ready link. Soft warnings only. No file limits.' },
  { route: 'prismlumen', title: 'Prism Lumen', blurb: 'Sequential multi-file shares. Each local file settles under a shared title and caption with its own prism accent. Permanent Discord-ready links. Soft size warnings only. Apple-style springs on frosted glass.' },
  { route: 'horizondesk', title: 'Horizon Desk', blurb: 'Cinematic horizontal multi-file shares. Drop locals along a quiet light line, shape a shared title and cool accent. Each becomes its own permanent Discord-ready link. Soft size warnings only. Apple-style springs on frosted glass.' },
  { route: 'gossamerdesk', title: 'Gossamer Desk', blurb: 'Delicate multi-file shares with soft notes and muted accents. Each local file becomes its own permanent Discord-ready link. Soft size warnings only. Apple-style springs on frosted glass.' },
  { route: 'pathweaver', title: 'Path Weaver', blurb: 'Weave a short sequence of titled notes and optional local files. Publish the whole path as one clean markdown share. Soft warnings only. Polished Discord embeds. Apple-style springs.' },
  { route: 'aurorapath', title: 'Aurora Path', blurb: 'Build a short sequence of titles and notes. Publish the whole path as a clean markdown share. Soft warnings only. Polished Discord embeds. Apple-style springs.' },
  { route: 'centraldrop', title: 'Central Drop', blurb: 'Everything in one place. Multi-file drops cascade into permanent shares with polished Discord embeds. Soft size warnings only. Apple-style springs.' },
  { route: 'orbitdesk', title: 'Orbit Desk', blurb: 'Map a central idea and orbiting thoughts. Publish the map as a clean markdown share. Soft size warnings only. Polished Discord embeds. Apple-style springs.' },
  { route: 'constellation', title: 'Constellation', blurb: 'Drop several files into a soft orbit around a shared note. Each receives its own polished Discord embed. Soft size warnings only.' },
  { route: 'lattice', title: 'Lattice', blurb: 'Pick several locals. Each lands as its own share card. Soft warnings for heavy batches. Nothing is refused.' },
  { route: 'signaturedesk', title: 'Signature Desk', blurb: 'Draw a signature or quiet mark and publish it as a permanent share. Soft size warnings only. Polished Discord embeds. Apple-style springs.' },
  { route: 'moodboard', title: 'Mood Board', blurb: 'Pick a mood, add a note, and publish a luminous feeling card as a permanent share. Soft warnings only. Discord embeds included.' },
  { route: 'whispernote', title: 'Whisper Note', blurb: 'Leave a short note that can fade after a chosen time. Uploads as a local file to the share database. Soft warnings only. Polished embeds.' },
  { route: 'nameplatedesk', title: 'Nameplate Desk', blurb: 'Type a name or title, choose an accent and style, and publish a sleek nameplate as a permanent share. Soft size warnings only. Polished Discord embeds. Apple-style springs.' },
  { route: 'capsuledesk', title: 'Capsule Desk', blurb: 'Seal a note or file until a future date. Soft warnings only. Polished Discord embeds on every link. Apple-style springs.' },
  { route: 'timelinedesk', title: 'Timeline Desk', blurb: 'Build a dated sequence of titles, notes, and optional local files. Publish the whole timeline as a permanent markdown share with polished Discord embeds. Soft size warnings only. Apple-style springs.' },
  { route: 'lumennote', title: 'Lumen Note', blurb: 'Type a quiet note, choose a glow color, and publish a luminous card as a permanent share. Soft size warnings only. Polished Discord embeds.' },
  { route: 'harmonydesk', title: 'Harmony Desk', blurb: 'Generate analogous, complementary, or triadic palettes from a seed color and publish the set as a permanent share.' },
  { route: 'pixeldesk', title: 'Pixel Desk', blurb: 'Paint a 16×16 grid, choose colors, and publish the pixel art as a permanent share. Soft size warnings only.' },
  { route: 'quotecard', title: 'Quote Card', blurb: 'Type a quote and attribution, preview a typographic card, and publish it as a permanent share. Soft size warnings only.' },
  { route: 'annotatedesk', title: 'Annotate Desk', blurb: 'Drop an image, draw marks over it, add a caption, and publish the annotated result as a permanent share.' },
];

export default function DirectoryPage() {
  const { navigate } = useRouter();
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return DESKS;
    return DESKS.filter((d) => d.title.toLowerCase().includes(s) || d.blurb.toLowerCase().includes(s) || d.route.includes(s));
  }, [q]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 110, damping: 20 }}
        >
          <p className="text-[#0A84FF] text-sm font-medium mb-2 tracking-wide">desks</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">every surface.</h1>
          <p className="text-neutral-400 text-sm mb-8 max-w-xl leading-relaxed">
            Browse the specialized desks. All prior features remain. Soft size warnings only. Every share link carries a polished Discord embed. Central file hosting stays intact.
          </p>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="search desks…"
            className="w-full max-w-sm bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-neutral-500 mb-8 focus:outline-none focus:border-white/25"
          />
          <div className="grid sm:grid-cols-2 gap-4">
            {filtered.map((d, i) => (
              <motion.button
                key={d.route}
                onClick={() => navigate(d.route)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, type: 'spring', stiffness: 200, damping: 24 }}
                whileHover={{ y: -3 }}
                className="glass rounded-2xl p-5 text-left hover:bg-white/[0.06] transition"
              >
                <h2 className="text-base font-medium mb-1">{d.title}</h2>
                <p className="text-xs text-neutral-500 leading-relaxed">{d.blurb}</p>
              </motion.button>
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="text-neutral-500 text-sm mt-8">no desks match. try a different word.</p>
          )}
          <p className="text-[11px] text-neutral-600 mt-12">
            Many more desks exist as pages. This list surfaces the ones most people reach for. New surfaces appear while every prior desk stays intact. No boosting, no hard file limits.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
