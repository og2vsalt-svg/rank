import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from './Router';
import Navbar from './Navbar';

const desks = [
  { to: "quiettide", label: "quiet tide", desc: "new specialized desk. drop local files onto a soft tidal wave of frosted glass. shared note, accent. batch-publish to the database. every link unfurls a polished Discord embed. soft size warnings only. no hard limits. apple-style springs." },
  { to: "quietorbit", label: "quiet orbit", desc: "drop local files into a soft orbital path around a quiet center. shared note, accent. batch-publish to the database. every link unfurls a polished Discord embed. soft size warnings only. no hard limits. apple-style springs." },
  { to: "quietnebula", label: "quiet nebula", desc: "drop local files into drifting soft clouds of frosted glass. shared note, accent. batch-publish to the database. every link unfurls a polished Discord embed. soft size warnings only. no hard limits. apple-style springs." },
  { to: "quietprismdesk", label: "quiet prism desk", desc: "drop local files through a prism of frosted glass. polished Discord embeds on every link. soft size warnings only. no hard limits. apple-style springs." },
  { to: "quietkeepsake", label: "quiet keepsake", desc: "drop files that matter. give each a short personal note. they settle into the database with polished Discord embeds. soft size warnings only. no hard limits." },
  { to: "quietframe", label: "quiet frame", desc: "drop an image. it settles into a soft polaroid frame and publishes with a polished Discord embed. soft size warnings only. no hard limits." },
  { to: "quietecho", label: "quiet echo", desc: "multi-file drop with soft expanding circular rings in your accent color. shared note. batch-publish to the database. every link unfurls a polished Discord embed. soft warnings only." },
  { to: "quietcanvas", label: "quiet canvas", desc: "freehand sketch on frosted glass. export as png and publish with a polished Discord embed. soft size warnings only." },
  { to: "quietnotes", label: "quiet notes", desc: "local collection of short notes. publish the whole set as a shared text file with a polished Discord embed. soft warnings only." },
  { to: "quietmosaic", label: "quiet mosaic", desc: "drop local files into a living mosaic. images settle into a soft glass grid. shared note and accent. every link unfurls a polished Discord embed. soft warnings only." },
  { to: "quietwhisper", label: "quiet whisper", desc: "multi-file drop that settles into soft floating glass cards. batch-publish with polished Discord embeds. soft size warnings only." },
  { to: "quietlantern", label: "quiet lantern", desc: "drop local files. they hang as soft glowing lanterns with gentle floating motion. share to the database. polished Discord embeds. soft warnings only." },
  { to: "quietorchard", label: "quiet orchard", desc: "drop local files. they grow into soft frosted-glass trees with gentle spring growth, fruit-like previews, and a shared note. batch-publish to the database. every link unfurls a polished Discord embed. soft size warnings only. no hard limits. human-crafted Apple-style pacing. all prior desks remain fully intact." },
  { to: "quietfade", label: "quiet fade", desc: "drop a local file or write a quiet note that gently fades after a chosen number of hours. settles into the database with a polished Discord embed. soft size warnings only. no hard limits. human-crafted Apple-style spring motion on frosted glass. all prior desks remain fully intact." },
  { to: "quietdaily", label: "quiet daily", desc: "date a quiet note or attach a local file. it settles into the database with a polished Discord embed. soft size warnings only. no hard limits. apple-style springs and frosted glass. prior desks remain fully intact." },
  { to: "quietlumen", label: "quiet lumen", desc: "drop local files. they settle as soft glowing orbs of frosted glass with gentle spring light. shared caption, warm accent. batch-publish to the database. every link unfurls a polished Discord embed. soft size warnings only. no hard limits. human-crafted Apple-style pacing. all prior desks remain fully intact." },
  { to: "quietfolio", label: "quiet folio", desc: "compose a quiet portfolio of local files. each piece gets its own title and note, or share one caption. spring-animated frosted glass grid. batch-publish to the database. every link unfurls a polished Discord embed. soft size warnings only. no hard limits. human-crafted Apple-style pacing. all prior desks remain fully intact." },
  { to: "vault", label: "vault", desc: "main local vault" },
  { to: "directory", label: "desks", desc: "this page" },
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
