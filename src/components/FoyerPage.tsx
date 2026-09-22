import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { listPublicShares, shareUrls, type CloudMeta } from '../lib/cloudShare';

function formatBytes(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  return (n / (1024 * 1024)).toFixed(2) + ' mb';
}

export default function FoyerPage() {
  const { navigate } = useRouter();
  const [rows, setRows] = useState<CloudMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await listPublicShares(36);
      if (!cancelled) {
        setRows(list);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0a84ff] text-sm mb-2">foyer</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">recent public drops.</h1>
          <p className="text-neutral-400 text-sm mb-8">not the vault. a lobby over the share table so you can copy a discord-ready /s link without hunting ids.</p>
          {loading ? (
            <p className="text-sm text-neutral-500">loading foyer…</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-neutral-500">nothing public yet. drop something from harbor, courier, or transfer.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {rows.map((row, i) => (
                <motion.div
                  key={row.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="glass rounded-3xl p-5"
                >
                  <p className="text-white text-sm font-medium truncate">{row.name}</p>
                  <p className="text-xs text-neutral-500 mt-1">{formatBytes(row.size)} · {row.type}</p>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <button onClick={() => navigate('share', row.id)} className="px-4 py-2 rounded-full bg-white text-black text-xs font-medium">open</button>
                    <button
                      onClick={async () => {
                        const url = shareUrls(row.id).embed;
                        await navigator.clipboard.writeText(url);
                        setCopied(url);
                      }}
                      className="px-4 py-2 rounded-full bg-white/5 text-xs"
                    >
                      copy discord link
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          {copied && <p className="text-xs text-neutral-500 mt-6">copied {copied}</p>}
        </motion.div>
      </div>
    </div>
  );
}
