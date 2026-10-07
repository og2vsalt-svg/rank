import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { useRouter } from './Router';

const SB_URL = (
  (import.meta as any).env?.VITE_SUPABASE_URL ||
  'https://tqfocdktvjuwoiyfgesb.supabase.co'
).replace(/\/$/, '');
const SB_KEY =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

async function loadSlip(id: string) {
  const res = await fetch(`${SB_URL}/rest/v1/copy_slips?id=eq.${encodeURIComponent(id)}&select=*&limit=1`, {
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
  });
  if (!res.ok) return null;
  const rows = await res.json();
  return rows[0] || null;
}

export default function CopydeskPage() {
  const { shareId } = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [author, setAuthor] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [link, setLink] = useState('');
  const [slip, setSlip] = useState<any>(null);

  useEffect(() => {
    if (!shareId) return;
    loadSlip(shareId).then(setSlip);
  }, [shareId]);

  async function fileSlip() {
    setError('');
    if (!title.trim() || !body.trim()) {
      setError('a slip needs a title and some words.');
      return;
    }
    setBusy(true);
    try {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const row = { id, title: title.trim().slice(0, 140), body: body.trim().slice(0, 12000), author: author.trim() || null, accent };
      const saved = await fetch(`${SB_URL}/rest/v1/copy_slips`, {
        method: 'POST',
        headers: {
          apikey: SB_KEY,
          Authorization: `Bearer ${SB_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify(row),
      });
      if (!saved.ok) throw new Error((await saved.text()).slice(0, 180) || 'could not file the slip');
      setSlip(row);
      setLink(`${location.origin}/copydesk/${id}`);
    } catch (err: any) {
      setError(err?.message || 'could not file the slip');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0b0b0d] text-white">
      <Navbar />
      <main className="max-w-2xl mx-auto px-5 pt-24 pb-20">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] tracking-wide text-[#0a84ff]">copy desk</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }} className="mt-2 text-4xl font-semibold tracking-tight">A page, not a cabinet.</motion.h1>
        <p className="mt-3 text-[15px] leading-relaxed text-white/60">Write a short slip. It lands in the copy desk table and the link unfurls in Discord with the title and the first lines. Files stay on the satchel and the older desks.</p>
        {slip && (
          <article className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="text-2xl font-medium tracking-tight">{slip.title}</h2>
            <p className="mt-4 whitespace-pre-wrap text-[15px] leading-7 text-white/75">{slip.body}</p>
            {slip.author && <p className="mt-4 text-xs text-white/40">{slip.author}</p>}
          </article>
        )}
        <section className="mt-8 space-y-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="title" className="w-full rounded-2xl bg-black/40 border border-white/10 px-3 py-2.5 outline-none focus:border-[#0a84ff]" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="the note itself" rows={8} className="w-full rounded-2xl bg-black/40 border border-white/10 px-3 py-2.5 outline-none focus:border-[#0a84ff]" />
          <div className="grid grid-cols-2 gap-3">
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="signed" className="rounded-2xl bg-black/40 border border-white/10 px-3 py-2.5 outline-none focus:border-[#0a84ff]" />
            <input value={accent} onChange={(e) => setAccent(e.target.value)} className="rounded-2xl bg-black/40 border border-white/10 px-3 py-2.5 outline-none focus:border-[#0a84ff]" />
          </div>
          {error && <p className="text-xs text-red-300">{error}</p>}
          <button disabled={busy} onClick={fileSlip} className="rounded-full bg-white text-black px-5 py-2.5 text-sm font-medium disabled:opacity-50 active:scale-[0.98] transition-transform">
            {busy ? 'filing…' : 'file the slip'}
          </button>
          {link && <p className="text-sm break-all text-white/75">card link: <a className="text-[#0a84ff]" href={link}>{link}</a></p>}
        </section>
      </main>
      <Footer />
    </div>
  );
}
