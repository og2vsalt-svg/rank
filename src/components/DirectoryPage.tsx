import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';

const DESKS = [
  { route: 'core', title: 'Core', blurb: 'The quiet center. Drop local files. Soft warnings only.' },
  { route: 'solace', title: 'Solace', blurb: 'Quiet file + short note. Polished Discord embeds.' },
  { route: 'horizon', title: 'Horizon', blurb: 'Calm line of recent public shares. Soft springs, frosted glass.' },
  { route: 'bundle', title: 'Bundle', blurb: 'Group several files into one shareable collection with Discord embeds.' },
  { route: 'prism', title: 'Prism', blurb: 'Color each drop. Per-file accents on Discord embeds.' },
  { route: 'gallery', title: 'Gallery', blurb: 'Living view of recent public shares.' },
  { route: 'timeline', title: 'Timeline', blurb: 'What happened in this vault lately.' },
  { route: 'pulse', title: 'Pulse', blurb: 'Quiet activity and arrival counts.' },
  { route: 'quietnotes', title: 'Quiet Notes', blurb: 'Write a note. It becomes a shareable file.' },
  { route: 'quietharbor', title: 'Quiet Harbor', blurb: 'A softer place to leave things.' },
  { route: 'quietsignal', title: 'Quiet Signal', blurb: 'Minimal signal desk.' },
  { route: 'lens', title: 'Lens', blurb: 'Closer look at media.' },
  { route: 'diary', title: 'Diary', blurb: 'Notes that stay quiet until shared.' },
  { route: 'atelier', title: 'Atelier', blurb: 'A working surface for making.' },
  { route: 'aurora', title: 'Aurora', blurb: 'Soft light on shared files.' },
  { route: 'beacon', title: 'Beacon', blurb: 'Something others can find.' },
  { route: 'haven', title: 'Haven', blurb: 'Safe place for drops.' },
  { route: 'keep', title: 'Keep', blurb: 'Hold onto what matters.' },
  { route: 'ledger', title: 'Ledger', blurb: 'A record of what moved.' },
  { route: 'listening', title: 'Listening', blurb: 'Audio-focused desk.' },
  { route: 'palette', title: 'Palette', blurb: 'Color and form.' },
  { route: 'quill', title: 'Quill', blurb: 'Write and share text.' },
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
            Browse the specialized desks. All prior features remain. Soft size warnings only. Every share link carries a polished Discord embed.
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
            Many more desks exist as pages. This list surfaces the ones most people reach for. New surfaces appear while every prior desk stays intact.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
