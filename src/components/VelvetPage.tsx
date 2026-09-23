import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function VelvetPage() {
  const [page, setPage] = useState('vault');
  const [copied, setCopied] = useState(false);

  const embed = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/p/${encodeURIComponent(page || 'home')}`;
  }, [page]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">velvet</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">discord cards for every desk.</h1>
          <p className="text-neutral-400 text-sm mb-6">paste a /p/ link in discord. crawlers get og + twitter tags. humans bounce to the real page.</p>
          <input
            value={page}
            onChange={(e) => setPage(e.target.value.replace(/[^a-z0-9-]/gi, '').toLowerCase())}
            placeholder="page slug, like vault or drop"
            className="w-full mb-4 rounded-2xl bg-white/[0.04] border border-white/8 px-4 py-3 text-sm outline-none focus:border-white/20"
          />
          <p className="text-xs text-neutral-500 break-all mb-4">{embed}</p>
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(embed);
              setCopied(true);
              setTimeout(() => setCopied(false), 1400);
            }}
            className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium"
          >
            {copied ? 'copied' : 'copy embed url'}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
