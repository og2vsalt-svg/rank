import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, shareUrls, type CloudMeta } from '../lib/cloudShare';
import { useRouter } from './Router';

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MezzaninePage() {
  const { navigate } = useRouter();
  const [rows, setRows] = useState<CloudMeta[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    listPublicShares(36)
      .then(setRows)
      .finally(() => setBusy(false));
  }, []);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0a84ff] text-sm mb-2">mezzanine</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a shelf of public stills.</h1>
          <p className="text-neutral-400 text-sm max-w-xl mb-10 leading-relaxed">
            not a vault. this floor only looks at what already went public in the share database.
            tap a card to open the discord-ready link.
          </p>
        </motion.div>
        {busy && <p className="text-neutral-500 text-sm">listening to the db…</p>}
        {!busy && rows.length === 0 && (
          <p className="text-neutral-500 text-sm">the shelf is empty. drop something from loft or drop first.</p>
        )}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((row, i) => (
            <motion.button
              key={row.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.4), duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => navigate('share', row.id)}
              className="glass rounded-[24px] p-5 text-left hover:bg-white/[0.06] transition-all duration-300"
            >
              <div className="text-[11px] text-neutral-500 mb-2">{row.type || 'file'}</div>
              <div className="text-white text-sm truncate mb-2">{row.name}</div>
              <div className="flex items-center justify-between text-xs text-neutral-500">
                <span>{pretty(row.size)}</span>
                <span>{row.downloads ?? 0} opens</span>
              </div>
              {row.url?.startsWith('http') && String(row.type).startsWith('image/') && (
                <img src={row.url} alt="" className="mt-3 w-full h-28 object-cover rounded-xl opacity-90" />
              )}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
