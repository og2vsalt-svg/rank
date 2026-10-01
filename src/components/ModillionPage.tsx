import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, shareUrls, type CloudMeta } from '../lib/cloudShare';

const SB_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SB_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type Label = { id: string; share_id: string | null; title: string; note: string; created_at: string };

export default function ModillionPage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [pick, setPick] = useState('');
  const [title, setTitle] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const rows = await listPublicShares(12);
    setShares(rows);
    const res = await fetch(`${SB_URL}/rest/v1/handoffs?select=id,share_id,title,note,created_at&order=created_at.desc&limit=12`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    });
    if (res.ok) setLabels(await res.json());
  };

  useEffect(() => { load().catch(() => setErr('could not read the shelf')); }, []);

  const pin = async () => {
    if (!title.trim()) return;
    setBusy(true);
    setErr('');
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const res = await fetch(`${SB_URL}/rest/v1/handoffs`, {
      method: 'POST',
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        id,
        share_id: pick || null,
        title: title.trim().slice(0, 140),
        note: '',
        author: 'modillion',
      }),
    });
    if (!res.ok) setErr(await res.text());
    else {
      setTitle('');
      await load();
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="mb-6">
          <p className="text-[#af52de] text-xs font-medium tracking-wide mb-2">modillion</p>
          <h1 className="text-3xl font-semibold text-white tracking-tight">a bracket for names</h1>
          <p className="text-neutral-400 text-sm mt-2 max-w-lg">not a vault. pin a short label under a share that already exists, or leave the bracket empty and just name the shelf.</p>
        </motion.div>
        <div className="glass rounded-[28px] p-5 mb-5">
          <select value={pick} onChange={(e) => setPick(e.target.value)} className="w-full rounded-2xl bg-black/40 border border-white/10 px-3 py-3 text-sm text-white mb-3">
            <option value="">no file — label only</option>
            {shares.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="bracket label" className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white outline-none" />
          <button disabled={!title.trim() || busy} onClick={pin} className="mt-3 rounded-full bg-white text-black text-sm font-medium px-5 py-2.5 disabled:opacity-40">{busy ? 'pinning…' : 'pin label'}</button>
          {err && <p className="text-red-300 text-xs mt-3 break-all">{err}</p>}
        </div>
        <div className="space-y-3">
          {labels.map((l, i) => (
            <motion.div key={l.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.04 }} className="glass rounded-3xl px-5 py-4">
              <p className="text-white text-sm font-medium">{l.title}</p>
              {l.note && <p className="text-neutral-400 text-sm mt-1">{l.note}</p>}
              {l.share_id && <a className="text-[#0a84ff] text-xs mt-2 inline-block" href={shareUrls(l.share_id).embed}>{shareUrls(l.share_id).embed}</a>}
            </motion.div>
          ))}
          {!labels.length && <p className="text-neutral-500 text-sm">the brackets are empty.</p>}
        </div>
      </div>
    </div>
  );
}
