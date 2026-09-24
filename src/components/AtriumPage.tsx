import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, shareUrls, type CloudMeta } from '../lib/cloudShare';
import { useRouter } from './Router';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(1) + ' mb';
}

export default function AtriumPage() {
  const { navigate } = useRouter();
  const [rows, setRows] = useState<CloudMeta[]>([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    listPublicShares(36)
      .then(setRows)
      .catch(() => setErr('could not reach the public table'));
  }, []);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0a84ff] text-sm mb-2">atrium</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">recent public drops, laid out quietly.</h1>
          <p className="text-neutral-400 text-sm mb-7">reads the same cloud table drop uses. cards copy a discord-ready embed link.</p>
          {err && <p className="text-xs text-red-400 mb-4">{err}</p>}
          <div className="grid sm:grid-cols-2 gap-3">
            {rows.map((r) => {
              const urls = shareUrls(r.id);
              return (
                <div key={r.id} className="glass rounded-[24px] p-5">
                  <p className="text-sm font-medium truncate">{r.name}</p>
                  <p className="text-xs text-neutral-500 mt-1">{pretty(r.size)} · {(r.type || '').split('/')[0] || 'file'}</p>
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => navigate('share', r.id)} className="px-3.5 py-1.5 rounded-full bg-white text-black text-xs font-medium">open</button>
                    <button
                      onClick={() => navigator.clipboard.writeText(urls.embed).catch(() => {})}
                      className="px-3.5 py-1.5 rounded-full bg-white/8 text-xs"
                    >
                      copy embed
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {!rows.length && !err && <p className="text-sm text-neutral-500">no public drops yet</p>}
        </motion.div>
      </div>
    </div>
  );
}
