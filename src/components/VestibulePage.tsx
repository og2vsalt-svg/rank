import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { fetchShare, shareUrls } from '../lib/cloudShare';

function formatBytes(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  return (n / (1024 * 1024)).toFixed(2) + ' mb';
}

export default function VestibulePage() {
  const [id, setId] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [row, setRow] = useState<Awaited<ReturnType<typeof fetchShare>>>(null);

  const look = async (e: React.FormEvent) => {
    e.preventDefault();
    const needle = id.trim();
    if (!needle) return;
    setBusy(true);
    setErr('');
    setRow(null);
    try {
      const meta = await fetchShare(needle);
      if (!meta) {
        setErr('nothing public lives at that id.');
        return;
      }
      setRow(meta);
    } catch (er: any) {
      setErr(er?.message || 'lookup failed');
    } finally {
      setBusy(false);
    }
  };

  const urls = row ? shareUrls(row.id) : null;

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20 px-5">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="max-w-xl mx-auto">
          <p className="text-[#0a84ff] text-sm mb-2">vestibule</p>
          <h1 className="text-4xl font-semibold tracking-tight text-white mb-3">stand in the doorway and ask for a drop.</h1>
          <p className="text-neutral-400 text-sm mb-8">look up a public share id. copy the discord card. nothing is stored here.</p>
          <form onSubmit={look} className="flex gap-2 mb-6">
            <input value={id} onChange={(e) => setId(e.target.value)} placeholder="share id" className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-sm text-white outline-none" />
            <button disabled={busy} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">{busy ? '…' : 'ask'}</button>
          </form>
          {err && <p className="text-red-400 text-sm">{err}</p>}
          {row && urls && (
            <div className="glass rounded-3xl p-6">
              <p className="text-white text-lg">{row.name}</p>
              <p className="text-neutral-500 text-sm mt-1">{formatBytes(row.size)} · {row.type}</p>
              {row.type.startsWith('image/') && <img src={row.url} alt="" className="mt-4 rounded-2xl w-full" />}
              <p className="text-[#0a84ff] text-xs mt-4 break-all">{urls.embed}</p>
              <button onClick={() => navigator.clipboard.writeText(urls.embed)} className="mt-4 px-4 py-2 rounded-full bg-white/8 text-sm text-white">copy discord embed</button>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
