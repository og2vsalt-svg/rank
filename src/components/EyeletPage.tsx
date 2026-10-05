import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';

const SB_URL = (
  (import.meta as any).env?.VITE_SUPABASE_URL ||
  'https://tqfocdktvjuwoiyfgesb.supabase.co'
).replace(/\/$/, '');
const SB_KEY =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type Yarn = { id: string; file_name: string | null; note: string | null; author: string | null; share_id: string | null };
type Ring = { id: string; title: string | null; note: string | null; accent: string | null; yarn_ids: string[] | null };

function rid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

async function sb(path: string, init?: RequestInit) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) throw new Error((await res.text()).slice(0, 180) || 'request failed');
  return res.json();
}

export default function EyeletPage() {
  const { shareId, navigate } = useRouter();
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [raw, setRaw] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [ring, setRing] = useState<Ring | null>(null);
  const [yarns, setYarns] = useState<Yarn[]>([]);
  const [made, setMade] = useState('');

  useEffect(() => {
    if (!shareId) return;
    let stop = false;
    (async () => {
      const rows = await sb(`eyelets?id=eq.${encodeURIComponent(shareId)}&select=*&limit=1`).catch(() => []);
      const row = Array.isArray(rows) ? rows[0] : null;
      if (stop || !row) return;
      setRing(row);
      const ids = (row.yarn_ids || []).filter(Boolean);
      if (!ids.length) return;
      const list = ids.map((id: string) => `id.eq.${encodeURIComponent(id)}`).join(',');
      const found = await sb(`spunyarns?or=(${list})&select=id,file_name,note,author,share_id`).catch(() => []);
      if (!stop) setYarns(Array.isArray(found) ? found : []);
    })();
    return () => { stop = true; };
  }, [shareId]);

  async function send() {
    setErr('');
    const yarn_ids = raw.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean).slice(0, 24);
    if (!title.trim()) {
      setErr('name the ring');
      return;
    }
    setBusy(true);
    try {
      const id = rid();
      await sb('eyelets', {
        method: 'POST',
        body: JSON.stringify({ id, title: title.trim(), note: note.trim(), accent: '#FF9F0A', yarn_ids }),
      });
      const app = `${location.origin}/eyelet/${id}`;
      setMade(app);
      try { await navigator.clipboard.writeText(app); } catch { /* optional */ }
    } catch (e: any) {
      setErr(e?.message || 'could not close the ring');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="max-w-xl mx-auto px-5 pt-24 pb-20">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-xs uppercase tracking-[0.18em] text-[#ff9f0a] mb-2">eyelet</p>
          <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">a ring of yarns</h1>
          <p className="text-sm text-neutral-400 mb-6 leading-relaxed">
            Collect spunyarn ids into one pass-around link. The files stay on their yarns. This is a reading ring, not a vault. Discord unfurls /eyelet.
          </p>
        </motion.div>

        {ring && (
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-3xl p-5 mb-6">
            <h2 className="text-white font-medium mb-1">{ring.title}</h2>
            <p className="text-sm text-neutral-400 mb-4">{ring.note}</p>
            <ul className="space-y-2">
              {yarns.map((y) => (
                <li key={y.id}>
                  <button type="button" onClick={() => navigate('spunyarn', y.id)} className="text-left text-sm text-[#64d2ff]">
                    {y.file_name || y.id}
                    <span className="block text-neutral-500">{y.note || y.author || y.id}</span>
                  </button>
                </li>
              ))}
              {!yarns.length && <li className="text-sm text-neutral-500">no yarns on this ring yet</li>}
            </ul>
          </motion.section>
        )}

        <div className="glass rounded-3xl p-5">
          <input value={title} onChange={(e) => setTitle(e.target.value.slice(0, 80))} placeholder="ring name" className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none mb-3" />
          <textarea value={note} onChange={(e) => setNote(e.target.value.slice(0, 500))} placeholder="why these belong together" className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none min-h-20 mb-3" />
          <textarea value={raw} onChange={(e) => setRaw(e.target.value.slice(0, 800))} placeholder="spunyarn ids, separated by spaces" className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none min-h-20 mb-4" />
          {err && <p className="text-xs text-red-300 mb-3">{err}</p>}
          <button type="button" disabled={busy} onClick={send} className="rounded-full bg-white text-black px-5 py-2.5 text-sm font-medium disabled:opacity-50">
            {busy ? 'closing…' : 'close the ring'}
          </button>
          {made && <p className="mt-4 text-sm text-[#ffd60a] break-all">{made}</p>}
        </div>
      </main>
    </div>
  );
}
