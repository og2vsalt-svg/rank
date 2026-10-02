import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

const SB_URL = (
  (import.meta as any).env?.VITE_SUPABASE_URL ||
  'https://tqfocdktvjuwoiyfgesb.supabase.co'
).replace(/\/$/, '');
const SB_KEY =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type Pin = { id: string; url: string; note: string | null; author: string | null; created_at: string };

function headers() {
  return { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' };
}

export default function LimberPage() {
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [pins, setPins] = useState<Pin[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [card, setCard] = useState('');
  const [warn, setWarn] = useState('');

  const load = async () => {
    const res = await fetch(`${SB_URL}/rest/v1/links?select=id,url,note,author,created_at&order=created_at.desc&limit=24`, { headers: headers() });
    if (!res.ok) return;
    const rows = await res.json();
    if (Array.isArray(rows)) setPins(rows);
  };

  useEffect(() => { load().catch(() => {}); }, []);

  const pin = async () => {
    const clean = url.trim();
    if (!/^https?:\/\//i.test(clean)) {
      setErr('needs a full http address');
      return;
    }
    setBusy(true);
    setErr('');
    setCard('');
    try {
      let fileCard = '';
      if (file) {
        setWarn(file.size > 20 * 1024 * 1024 ? 'large companion. the tab may pause while it sends. nothing is refused.' : '');
        const filed = await publishLocalFile(file, {
          caption: note || clean,
          author: author || 'limber',
          cardTitle: file.name,
          color: '#5E5CE6',
        });
        if (!filed.ok || !filed.id) {
          setErr(filed.error || 'companion file did not land');
          return;
        }
        fileCard = shareUrls(filed.id).embed;
      }
      const res = await fetch(`${SB_URL}/rest/v1/links`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ url: clean, note: [note, fileCard].filter(Boolean).join(' · ') || null, author: author || null }),
      });
      if (!res.ok) {
        setErr((await res.text()).slice(0, 180) || 'links table refused the pin');
        return;
      }
      const page = `${location.origin}/limber`;
      const copied = fileCard || page;
      setCard(copied);
      try { await navigator.clipboard.writeText(copied); } catch {}
      setUrl('');
      setNote('');
      setFile(null);
      await load();
    } catch (e: any) {
      setErr(e?.message || 'pin failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#5e5ce6] text-sm mb-2">limber</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a pin, not a drawer.</h1>
          <p className="text-neutral-400 text-sm mb-6">addresses land in the links table. a companion file, if you have one, still goes into the share database. Discord unfurls /limber and any /s card.</p>
          <div className="space-y-3">
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#5e5ce6]/50 transition" />
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="why it is here" className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#5e5ce6]/50 transition" />
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="your name, optional" className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#5e5ce6]/50 transition" />
            <label className="block cursor-pointer rounded-2xl border border-dashed border-white/15 px-4 py-4 text-sm text-neutral-400 hover:border-[#5e5ce6]/40 transition">
              <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              {file ? file.name : 'optional local file — no size cap'}
            </label>
            <button onClick={pin} disabled={busy} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50">{busy ? 'pinning…' : 'pin it'}</button>
          </div>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {card && <p className="text-xs text-neutral-400 mt-4 break-all">copied for Discord: {card}</p>}
        </motion.div>
        <div className="mt-4 space-y-2">
          {pins.map((pinRow, i) => (
            <motion.a key={pinRow.id} href={pinRow.url} target="_blank" rel="noreferrer" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.04 }} className="block glass rounded-2xl px-4 py-3 hover:bg-white/[0.04] transition">
              <p className="text-sm text-white truncate">{pinRow.note || pinRow.url}</p>
              <p className="text-xs text-neutral-500 truncate mt-1">{pinRow.url}{pinRow.author ? ` · ${pinRow.author}` : ''}</p>
            </motion.a>
          ))}
        </div>
      </div>
    </div>
  );
}
