import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, shareUrls, type CloudMeta } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(1) + ' mb';
}

export default function OxeyePage() {
  const [rows, setRows] = useState<CloudMeta[]>([]);
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState('');

  const load = async () => {
    setBusy(true);
    setErr('');
    try {
      const list = await listPublicShares(36);
      setRows(list);
    } catch {
      setErr('could not reach the share db');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { load(); }, []);

  const copy = async (id: string) => {
    const { embed } = shareUrls(id);
    try {
      await navigator.clipboard.writeText(embed);
      setCopied(id);
      setTimeout(() => setCopied(''), 1200);
    } catch {}
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">oxeye</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">recent public drops.</h1>
          <p className="text-neutral-400 text-sm mb-6">live rows from the share db. copy a /s card without opening the bytes. not a vault grid.</p>
          <button onClick={load} className="px-4 py-2 rounded-full bg-white/8 text-sm mb-5">{busy ? 'loading…' : 'refresh'}</button>
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}
          <div className="space-y-2">
            {rows.map((row) => (
              <div key={row.id} className="rounded-2xl bg-white/[0.03] border border-white/5 px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-white truncate">{row.name}</p>
                  <p className="text-[11px] text-neutral-500 truncate">{pretty(row.size)} · {row.type || 'file'} · {row.id}</p>
                </div>
                <button onClick={() => copy(row.id)} className="shrink-0 px-3 py-1.5 rounded-full bg-white text-black text-xs font-medium">{copied === row.id ? 'copied' : 'copy /s'}</button>
              </div>
            ))}
            {!busy && rows.length === 0 && <p className="text-sm text-neutral-500">nothing public yet.</p>}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
