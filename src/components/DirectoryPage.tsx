import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from './Router';
import Navbar from './Navbar';

const desks = [
  { to: 'quietcanopy', label: 'quiet canopy', desc: 'multi-file drop that settles into a soft canopy of swaying spring-animated frosted glass leaves, batch DB publish, live public canopy, Discord embeds. soft warnings only' },
  { to: 'quietmosaic', label: 'quiet mosaic', desc: 'multi-file drop that settles into a soft mosaic of spring-animated frosted glass tiles with per-tile notes, batch DB publish, live public mosaic, Discord embeds. soft warnings only' },
  { to: 'quietsketch', label: 'quiet sketch', desc: 'freehand canvas drawing on dark glass, publish as PNG to the database with Discord embeds. soft warnings only' },
  { to: 'quietshore', label: 'quiet shore', desc: 'files wash onto a soft shore of spring-animated frosted glass cards with live public waves, batch DB upload, Discord embeds. soft warnings only' },
  { to: 'quietwhisper', label: 'quiet whisper', desc: 'soft floating multi-file glass cards with gentle particle motion, spring animations, batch DB upload, Discord embeds. soft warnings only' },
  { to: 'quietkaleidoscope', label: 'quiet kaleidoscope', desc: 'reflective multi-file kaleidoscope with mirrored shards, spring motion, batch DB upload, Discord embeds' },
  { to: 'quiethelix', label: 'quiet helix', desc: 'spiraling multi-file helix with rotating glass beads, spring motion, batch DB upload, Discord embeds' },
  { to: 'quietdrift', label: 'quiet drift', desc: 'soft cloud drift for multi-file drops, gentle floating motion, spring animations, batch DB upload, Discord embeds' },
  { to: 'quietembers', label: 'quiet embers', desc: 'soft glowing embers for multi-file drops, floating pulse, spring animations, batch DB upload, Discord embeds' },
  { to: 'quietlantern', label: 'quiet lantern', desc: 'hanging glowing lanterns for multi-file drops, spring animations, batch DB upload, Discord embeds' },
  { to: 'quietribbon', label: 'quiet ribbon', desc: 'flowing multi-file ribbon of spring-animated glass cards, batch DB upload, Discord embeds' },
  { to: 'lumencollage', label: 'lumen collage', desc: 'drop images into a quiet grid collage, publish as one file with Discord embed' },
  { to: 'lumenquill', label: 'lumen quill', desc: 'compose notes with optional local file, spring preview, Discord embed' },
  { to: 'lumenpulse', label: 'lumen pulse', desc: 'interactive pulsing feed of recent shares with file drops' },
  { to: 'lumenorbit', label: 'lumen orbit', desc: 'files in quiet orbit with spring motion' },
  { to: 'canvasnote', label: 'canvas note', desc: 'draw and share a glass note image' },
  { to: 'quiettimeline', label: 'quiet timeline', desc: 'vertical stream of recent public shares' },

  { to: 'softquietprism', label: 'soft quiet prism', desc: 'refractive multi-file prism with spectral accents' },
  { to: 'softquietlattice', label: 'soft quiet lattice', desc: 'interlocking multi-file lattice with notes' },
  { to: 'softquietmosaic', label: 'soft quiet mosaic', desc: 'visual mosaic of files with per-piece notes' },
  { to: 'softquietbrook', label: 'soft quiet brook', desc: 'files flow gently downstream' },
  { to: 'softquietatrium', label: 'soft quiet atrium', desc: 'quiet light shafts for files' },
  { to: 'softquietvault', label: 'soft quiet vault', desc: 'private local + cloud shares' },
  { to: 'softquietecho', label: 'soft quiet echo', desc: 'echoing file drops' },
  { to: 'softquietharbor', label: 'soft quiet harbor', desc: 'files settle like boats' },
  { to: 'softquietmeadow', label: 'soft quiet meadow', desc: 'blooming glass flowers' },
  { to: 'softquietveil', label: 'soft quiet veil', desc: 'soft light layers' },
  { to: 'softquietconstellation', label: 'soft quiet constellation', desc: 'stars connecting files' },
  { to: 'quietcascade', label: 'quiet cascade', desc: 'multi-file cascade with spring cards, batch DB upload, Discord embeds' },
  { to: 'directshare', label: 'direct share', desc: 'upload local file to DB + Discord embed' },
  { to: 'publicboard', label: 'public board', desc: 'browse recent shares' },
  { to: 'notes', label: 'notes', desc: 'quiet local notes desk' },
  { to: 'vault', label: 'vault', desc: 'main local vault' },
  { to: 'quietnotes', label: 'quiet notes', desc: 'text notes to database' },
  { to: 'lumengallery', label: 'lumen gallery', desc: 'visual file gallery' },
  { to: 'appledesk', label: 'apple desk', desc: 'sleek focused desk' },
  { to: 'softlumen', label: 'soft lumen', desc: 'glowing file drops' },
  { to: 'haven', label: 'haven', desc: 'safe file harbor' },
];

export default function DirectoryPage() {
  const { navigate } = useRouter();
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const s = q.toLowerCase();
    return desks.filter(d => d.label.includes(s) || d.desc.includes(s) || d.to.includes(s));
  }, [q]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-16 px-5 max-w-3xl mx-auto">
        <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-semibold tracking-tight mb-2">desks</motion.h1>
        <p className="text-neutral-400 text-sm mb-6">search the specialized desks. all prior features preserved. file shares land in the database with Discord embeds. soft warnings only.</p>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="search desks…"
          className="w-full glass rounded-2xl px-4 py-3 text-sm outline-none mb-6"
        />
        <div className="grid gap-3">
          {filtered.map((d, i) => (
            <motion.button
              key={d.to}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              onClick={() => navigate(d.to)}
              className="glass rounded-2xl p-4 text-left hover:bg-white/5 transition"
            >
              <p className="text-sm font-medium">{d.label}</p>
              <p className="text-xs text-neutral-400 mt-0.5">{d.desc}</p>
            </motion.button>
          ))}
          {!filtered.length && <p className="text-neutral-500 text-sm">no desks match. try a different word.</p>}
        </div>
      </div>
    </div>
  );
}
