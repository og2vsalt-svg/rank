import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';

const DESKS = [
  { id: 'harbor', blurb: 'queue local files and publish each to the share database with its own Discord card.' },
  { id: 'quay', blurb: 'public log of drops already in the share table.' },
  { id: 'gallery', blurb: 'living grid of recent public shares. drop a file to add yours.' },
  { id: 'vault', blurb: 'your private local vault with folders, notes, and optional publish.' },
  { id: 'aether', blurb: 'soft cloud for notes and optional files.' },
  { id: 'lintel', blurb: 'hang a file over a doorway with a greeting.' },
  { id: 'sill', blurb: 'leave a short note on the window. no file required.' },
  { id: 'abacus', blurb: 'count expected arrivals against one local file.' },
  { id: 'bookplate', blurb: 'paste a name and motto onto a file.' },
  { id: 'parcel', blurb: 'address one file to a person with a return note.' },
  { id: 'waybill', blurb: 'delivery slip with stamped stops and optional file.' },
  { id: 'folio', blurb: 'reading copy of a file with title and excerpt.' },
  { id: 'swatch', blurb: 'pull colors from an image and keep the chips.' },
  { id: 'ledger', blurb: 'running book of lines with optional amounts.' },
  { id: 'commonplace', blurb: 'keep a sentence. no file.' },
  { id: 'transom', blurb: 'open a receiving window for others to drop files into.' },
  { id: 'oakdesk', blurb: 'write a file straight into its own Postgres table.' },
  { id: 'splice', blurb: 'pair two local files and keep their hashes.' },
  { id: 'cask', blurb: 'bundle several files into one share row.' },
  { id: 'wick', blurb: 'attach a file that fades after a chosen time.' },
  { id: 'handoff', blurb: 'name a person and hand them a file.' },
  { id: 'quoin', blurb: 'name a corner and attach a file.' },
  { id: 'holdfast', blurb: 'pin a file with a keeper note.' },
  { id: 'tender', blurb: 'ask a question and attach a file for replies.' },
  { id: 'slip', blurb: 'shared table. pick a short code and drop a file.' },
  { id: 'vitrine', blurb: 'dress a Discord card, then drop the file.' },
  { id: 'pressmark', blurb: 'generate a painted cover for Discord unfurls.' },
  { id: 'shelf', blurb: 'drop a local file into the shared shelf.' },
  { id: 'board', blurb: 'public files people left out.' },
  { id: 'catalog', blurb: 'this quiet index of every desk.' },
];

export default function CatalogPage() {
  const { navigate } = useRouter();
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return DESKS;
    return DESKS.filter((d) => d.id.includes(s) || d.blurb.toLowerCase().includes(s));
  }, [q]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-28 pb-20 px-5 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-[#0A84FF] text-sm font-medium mb-3 tracking-wide">catalog</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mb-4">every desk, one shelf.</h1>
          <p className="text-neutral-400 text-lg leading-relaxed max-w-2xl mb-8">
            Specialized tools around file hosting. Each keeps prior desks intact. Discord cards on every link. Large files warned, never refused.
          </p>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="search desks…"
            className="w-full mb-8 rounded-2xl bg-white/5 border border-white/10 px-5 py-4 text-white outline-none focus:border-[#0A84FF]/40 placeholder:text-neutral-500 transition"
          />
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-3">
          <AnimatePresence mode="popLayout">
            {list.map((d, i) => (
              <motion.button
                key={d.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ delay: Math.min(i, 14) * 0.02, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -2, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(d.id)}
                className="text-left glass rounded-2xl p-5 hover:bg-white/[0.07] transition"
              >
                <p className="text-white font-medium mb-1">/{d.id}</p>
                <p className="text-neutral-400 text-sm leading-relaxed">{d.blurb}</p>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>

        {list.length === 0 && (
          <p className="text-center text-neutral-500 mt-12">no desks match that.</p>
        )}
      </main>
    </div>
  );
}
