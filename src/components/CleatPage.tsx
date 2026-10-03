import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

type Pin = { id: string; url: string; note?: string | null; author?: string | null; created_at?: string };

export default function CleatPage() {
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  const [rows, setRows] = useState<Pin[]>([]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => {
    fetch('/api/cleat')
      .then((r) => r.json())
      .then((j) => setRows(Array.isArray(j.rows) ? j.rows : []))
      .catch(() => {});
  };

  useEffect(load, []);

  const pin = async () => {
    setBusy(true);
    setErr('');
    try {
      const r = await fetch('/api/cleat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, note, author: 'cleat' }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || 'could not pin');
      setUrl('');
      setNote('');
      load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'cleat failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#64D2FF] text-sm mb-2">cleat</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">pin an address. not a file.</h1>
          <p className="text-neutral-400 text-sm mb-6">a small shelf of links, separate from the vault. Discord unfurls /cleat.</p>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://"
            className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#64D2FF]/60"
          />
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="why this stays on the rail"
            rows={3}
            className="mt-3 w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#64D2FF]/60 resize-none"
          />
          <button onClick={pin} disabled={busy || !url} className="mt-4 rounded-full bg-white text-black px-5 py-2.5 text-sm font-medium disabled:opacity-40">
            {busy ? 'pinning…' : 'pin it'}
          </button>
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
        </motion.div>
        <div className="mt-6 space-y-2">
          {rows.map((row) => (
            <a key={row.id} href={row.url} className="block glass rounded-2xl px-4 py-3 hover:bg-white/5 transition" target="_blank" rel="noreferrer">
              <p className="text-sm text-white break-all">{row.url}</p>
              {row.note && <p className="text-xs text-neutral-500 mt-1">{row.note}</p>}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
