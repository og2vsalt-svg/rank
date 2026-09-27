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

export default function FlotsamPage() {
  const { navigate } = useRouter();
  const [rows, setRows] = useState<CloudMeta[]>([]);
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState('');

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const list = await listPublicShares(36);
        if (!cancel) setRows(list);
      } catch {
        if (!cancel) setErr('could not read the public share db.');
      }
    })();
    return () => { cancel = true; };
  }, []);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-[#0a84ff] text-sm mb-2">flotsam</p>
          <h1 className="text-3xl font-semibold mb-3">what washed up public.</h1>
          <p className="text-neutral-400 text-sm mb-8">live rows from the share db. copy the discord /s embed without opening the file.</p>
          {err && <p className="text-xs text-red-400 mb-4">{err}</p>}
          {rows.length === 0 && !err && <p className="text-sm text-neutral-500">nothing public right now, or the db is quiet.</p>}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {rows.map((r) => {
              const urls = shareUrls(r.id);
              return (
                <div key={r.id} className="glass rounded-[28px] p-5 hover:-translate-y-0.5 transition-transform">
                  <p className="text-white truncate">{r.name}</p>
                  <p className="text-xs text-neutral-500 mt-1">{formatBytes(r.size)} · {(r.type || 'file').split(';')[0]}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button onClick={() => navigate('share', r.id)} className="px-3 py-1.5 rounded-full bg-white text-black text-xs font-medium">open</button>
                    <button
                      onClick={async () => {
                        try { await navigator.clipboard.writeText(urls.embed); setCopied(r.id); } catch {}
                      }}
                      className="px-3 py-1.5 rounded-full bg-white/8 text-xs"
                    >
                      {copied === r.id ? 'copied' : 'copy embed'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
