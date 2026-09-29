import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, shareUrls, type CloudMeta } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

export default function HatchwayPage() {
  const [rows, setRows] = useState<CloudMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState('');

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const list = await listPublicShares(36);
        if (live) setRows(list);
      } catch (e: any) {
        if (live) setErr(e?.message || 'could not read the share table');
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  const copy = async (id: string) => {
    const url = shareUrls(id).embed;
    await navigator.clipboard.writeText(url);
    setCopied(id);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0a84ff] text-sm mb-2">hatchway</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">public drops, not a vault.</h1>
          <p className="text-neutral-400 text-sm max-w-xl mb-8">
            live read of the share db. copy the /s card discord unfurls. nothing here lives in your private vault.
          </p>
        </motion.div>

        {loading && <p className="text-sm text-neutral-500">reading shares…</p>}
        {err && <p className="text-sm text-red-400">{err}</p>}
        {!loading && !rows.length && <p className="text-sm text-neutral-500">no public drops yet. publish one from keelson.</p>}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((row, i) => {
            const urls = shareUrls(row.id);
            return (
              <motion.article
                key={row.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 12) * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="glass rounded-[28px] p-5 hover:-translate-y-0.5"
              >
                <p className="text-sm font-medium tracking-tight truncate">{row.name}</p>
                <p className="text-[11px] text-neutral-500 mt-1">
                  {pretty(row.size)} · {(row.type || 'file').split(';')[0]}
                  {row.author ? ` · ${row.author}` : ''}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => copy(row.id)}
                    className="px-3 py-1.5 rounded-full bg-white text-black text-xs font-medium"
                  >
                    {copied === row.id ? 'copied card' : 'copy /s card'}
                  </button>
                  <a href={urls.app} className="px-3 py-1.5 rounded-full bg-white/8 text-xs text-neutral-200">
                    open
                  </a>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
