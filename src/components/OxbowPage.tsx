import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, shareUrls, type CloudMeta } from '../lib/cloudShare';
import { useRouter } from './Router';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

export default function OxbowPage() {
  const { navigate } = useRouter();
  const [rows, setRows] = useState<CloudMeta[]>([]);
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState('');

  const load = async () => {
    setBusy(true);
    setErr('');
    try {
      const list = await listPublicShares(36);
      setRows(list);
    } catch (e: any) {
      setErr(e?.message || 'could not read the river');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">oxbow</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a quiet river of public drops.</h1>
          <p className="text-neutral-400 text-sm mb-6">not a vault. just the latest files people flipped public. tap one and you get the embed-ready /s/ link discord actually unfurls.</p>
          <button onClick={load} className="px-4 py-2 rounded-full bg-white/8 text-sm text-neutral-200 hover:bg-white/12 transition-colors mb-6">{busy ? 'reading…' : 'refresh the bend'}</button>
          {err && <p className="text-xs text-red-400 mb-4">{err}</p>}
          <div className="space-y-2">
            {rows.map((r) => {
              const urls = shareUrls(r.id);
              return (
                <motion.button
                  key={r.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => navigate('share', r.id)}
                  className="w-full text-left rounded-2xl bg-black/25 border border-white/8 hover:border-[#0a84ff]/35 px-4 py-3.5 transition-colors"
                >
                  <p className="text-sm text-white truncate">{r.name}</p>
                  <p className="text-[11px] text-neutral-500 mt-1">{pretty(r.size)} · {r.type.split(';')[0]} · {urls.embed.replace(/^https?:\/\//, '')}</p>
                </motion.button>
              );
            })}
            {!busy && !rows.length && <p className="text-sm text-neutral-500">river is empty right now.</p>}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
