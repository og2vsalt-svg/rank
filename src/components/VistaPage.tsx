import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { listPublicShares, shareUrls, type CloudMeta } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  return (n / (1024 * 1024)).toFixed(2) + ' mb';
}

export default function VistaPage() {
  const { navigate } = useRouter();
  const [rows, setRows] = useState<CloudMeta[]>([]);
  const [busy, setBusy] = useState(true);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    let live = true;
    (async () => {
      setBusy(true);
      const list = await listPublicShares(32);
      if (live) {
        setRows(list);
        setBusy(false);
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">vista</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">live public drops.</h1>
          <p className="text-neutral-400 text-sm mb-7">
            not the vault. just a quiet feed of whatever landed in the share table. big files stay allowed — we only mutter if the tab might feel sleepy.
          </p>
          {busy && <p className="text-sm text-neutral-500">pulling the table…</p>}
          {!busy && rows.length === 0 && (
            <p className="text-sm text-neutral-500">nothing public yet. drop something from coral or ash.</p>
          )}
          <div className="space-y-2">
            {rows.map((row, i) => {
              const heavy = row.size > 20 * 1024 * 1024;
              return (
                <motion.div
                  key={row.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="rounded-2xl bg-white/[0.03] border border-white/8 px-4 py-3 flex items-center gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white truncate">{row.name}</p>
                    <p className="text-[11px] text-neutral-500">
                      {pretty(row.size)} · {row.type || 'file'}
                      {heavy ? ' · may feel slow on weak devices' : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('share', row.id)}
                    className="text-[12px] px-3 py-1.5 rounded-full bg-white/8 hover:bg-white/12 transition-colors"
                  >
                    open
                  </button>
                  <button
                    onClick={async () => {
                      const url = shareUrls(row.id).embed;
                      await navigator.clipboard.writeText(url);
                      setCopied(url);
                    }}
                    className="text-[12px] px-3 py-1.5 rounded-full bg-white text-black font-medium"
                  >
                    embed
                  </button>
                </motion.div>
              );
            })}
          </div>
          {copied && <p className="text-xs text-neutral-500 mt-4">copied discord link: {copied}</p>}
        </motion.div>
      </div>
    </div>
  );
}
