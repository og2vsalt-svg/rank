import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, shareUrls, type CloudMeta } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(1) + ' mb';
}

export default function OxbowPage() {
  const [rows, setRows] = useState<CloudMeta[] | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState('');

  const load = async () => {
    setBusy(true);
    setErr('');
    try {
      const list = await listPublicShares(48);
      setRows(list);
    } catch (e: any) {
      setErr(e?.message || 'the bend stayed still');
    } finally {
      setBusy(false);
    }
  };

  const copy = async (id: string) => {
    const url = shareUrls(id).embed;
    try { await navigator.clipboard.writeText(url); setCopied(url); } catch {}
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">oxbow</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a quiet bend of public drops.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            not the vault. just what people already put on the river. tap a card to copy the discord embed.
          </p>
          <button
            onClick={load}
            className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-200 transition"
          >
            {busy ? 'looking…' : rows ? 'refresh the bend' : 'look around the bend'}
          </button>
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {copied && <p className="text-xs text-neutral-500 mt-3 break-all">copied {copied}</p>}
          <div className="mt-6 grid gap-3">
            {(rows || []).map((r) => (
              <button
                key={r.id}
                onClick={() => copy(r.id)}
                className="text-left rounded-2xl bg-white/[0.03] border border-white/8 px-4 py-3 hover:border-[#0a84ff]/40 transition"
              >
                <p className="text-sm text-white truncate">{r.name}</p>
                <p className="text-xs text-neutral-500 mt-1">{pretty(r.size)} · {r.type}</p>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
