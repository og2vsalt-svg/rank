import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, shareUrls, type CloudMeta } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function SoundingPage() {
  const [rows, setRows] = useState<CloudMeta[]>([]);
  const [copied, setCopied] = useState('');
  const [quiet, setQuiet] = useState(false);

  useEffect(() => {
    listPublicShares(20).then((list) => {
      setRows(list);
      setQuiet(list.length === 0);
    });
  }, []);

  const copy = async (id: string) => {
    await navigator.clipboard.writeText(shareUrls(id).embed);
    setCopied(id);
    setTimeout(() => setCopied(''), 900);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] uppercase tracking-[0.16em] text-white/45">sounding</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">what is already on the water</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">Public drops from the share database. Copy a /s link and Discord draws the card. This desk does not store a second copy.</p>
        </motion.div>
        <div className="mt-8 space-y-2">
          {rows.map((row, i) => (
            <motion.button
              key={row.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 8) * 0.04, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => copy(row.id)}
              className="glass flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left"
            >
              <span className="min-w-0">
                <span className="block truncate text-[15px]">{row.name}</span>
                <span className="block text-[12px] text-white/40">{pretty(row.size)} · {row.type}</span>
              </span>
              <span className="shrink-0 text-[13px] text-[#0a84ff]">{copied === row.id ? 'copied' : 'copy card'}</span>
            </motion.button>
          ))}
          {quiet && <p className="text-[14px] text-white/45">nothing public yet. berth or fender will put the first one here.</p>}
        </div>
      </main>
    </div>
  );
}
