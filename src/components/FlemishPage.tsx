import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';

const SB_URL = ((import.meta as any).env?.VITE_SUPABASE_URL || 'https://tqfocdktvjuwoiyfgesb.supabase.co').replace(/\/$/, '');
const SB_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
type Card = { id: string; title: string; target: string; blurb: string | null; accent: string; created_at: string };

export default function FlemishPage() {
  const { shareId } = useRouter();
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [blurb, setBlurb] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [row, setRow] = useState<Card | null>(null);
  const [recent, setRecent] = useState<Card[]>([]);
  const headers = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` };

  const loadRecent = async () => {
    const res = await fetch(`${SB_URL}/rest/v1/flemish?select=id,title,target,blurb,accent,created_at&order=created_at.desc&limit=8`, { headers });
    if (!res.ok) return;
    const rows = await res.json();
    if (Array.isArray(rows)) setRecent(rows);
  };
  const loadOne = async (id: string) => {
    const res = await fetch(`${SB_URL}/rest/v1/flemish?id=eq.${encodeURIComponent(id)}&select=*&limit=1`, { headers });
    if (!res.ok) return;
    const rows = await res.json();
    if (Array.isArray(rows) && rows[0]) setRow(rows[0]);
  };
  useEffect(() => { loadRecent(); if (shareId) loadOne(shareId); }, [shareId]);

  const send = async () => {
    if (!title.trim() || !target.trim()) return;
    setBusy(true); setError('');
    try {
      const href = /^https?:\/\//i.test(target.trim()) ? target.trim() : `https://${target.trim()}`;
      const id = uid();
      const next = { id, title: title.trim().slice(0, 140), target: href.slice(0, 2000), blurb: blurb.trim().slice(0, 280) || null, accent };
      const ins = await fetch(`${SB_URL}/rest/v1/flemish`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=representation' },
        body: JSON.stringify(next),
      });
      if (!ins.ok) throw new Error(`flemish ${ins.status}: ${(await ins.text()).slice(0, 180)}`);
      const saved = await ins.json();
      setRow(Array.isArray(saved) ? saved[0] : { ...next, created_at: new Date().toISOString() });
      setTitle(''); setTarget(''); setBlurb('');
      loadRecent();
      history.pushState(null, '', `/flemish/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'could not coil the card');
    } finally {
      setBusy(false);
    }
  };
  const copy = async (value: string) => { try { await navigator.clipboard.writeText(value); } catch { setError(value); } };
  const card = row ? `${location.origin}/flemish/${row.id}` : '';

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#30d158] text-sm font-medium mb-2 tracking-wide">flemish</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mb-3">coil a link card. no drawer.</h1>
          <p className="text-neutral-400 max-w-xl mb-8">write a title, a destination, and a short blurb. the card lives in the flemish table, not the vault. paste /flemish in Discord and it unfurls. file desks stay where they were.</p>
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5">
            <label className="block text-sm text-neutral-300 mb-2">title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="evening note" className="w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#30D158] transition" />
            <label className="block text-sm text-neutral-300 mt-4 mb-2">destination</label>
            <input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="https://" className="w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#30D158] transition" />
            <label className="block text-sm text-neutral-300 mt-4 mb-2">blurb</label>
            <textarea value={blurb} onChange={(e) => setBlurb(e.target.value)} rows={3} className="w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#30D158] transition" />
            <label className="mt-4 flex items-center gap-3 text-sm text-neutral-300">accent <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="bg-transparent" /></label>
            {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
            <button onClick={send} disabled={busy || !title.trim() || !target.trim()} className="mt-5 rounded-full bg-white text-black px-5 py-2.5 text-sm font-medium disabled:opacity-40 transition active:scale-[0.98]">
              {busy ? 'coiling…' : 'coil the card'}
            </button>
          </div>
          {row && (
            <motion.a href={row.target} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 block rounded-3xl border border-white/10 p-5" style={{ boxShadow: `inset 3px 0 0 ${row.accent}` }}>
              <p className="text-white font-medium">{row.title}</p>
              <p className="text-sm text-neutral-400 mt-1">{row.blurb || row.target}</p>
              <button onClick={(e) => { e.preventDefault(); copy(card); }} className="mt-3 rounded-full bg-white/10 px-3 py-1.5 text-sm text-white">copy Discord card</button>
            </motion.a>
          )}
          <div className="mt-8 space-y-2">
            {recent.map((item) => (
              <button key={item.id} onClick={() => { setRow(item); history.pushState(null, '', `/flemish/${item.id}`); }} className="w-full text-left rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3 hover:bg-white/[0.05] transition">
                <span className="text-white">{item.title}</span>
                <span className="block text-xs text-neutral-500 truncate">{item.target}</span>
              </button>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
