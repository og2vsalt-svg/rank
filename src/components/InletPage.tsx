import { useEffect, useState } from 'react';
import Navbar from './Navbar';

const SB_URL = (
  (import.meta as any).env?.VITE_SUPABASE_URL ||
  'https://tqfocdktvjuwoiyfgesb.supabase.co'
).replace(/\/$/, '');
const SB_KEY =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type Inlet = {
  id: string;
  title: string;
  source_url: string | null;
  excerpt: string | null;
  mood: string | null;
  author: string | null;
  created_at: string;
};

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export default function InletPage() {
  const [title, setTitle] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [mood, setMood] = useState('');
  const [author, setAuthor] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [rows, setRows] = useState<Inlet[]>([]);

  async function load() {
    const res = await fetch(`${SB_URL}/rest/v1/inlets?select=*&order=created_at.desc&limit=16`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data)) setRows(data);
  }

  useEffect(() => {
    load().catch(() => {});
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setErr('Need a title.');
      return;
    }
    if (sourceUrl.trim() && !/^https?:\/\//i.test(sourceUrl.trim())) {
      setErr('Source should start with http or https.');
      return;
    }
    setBusy(true);
    setErr(null);
    setLink(null);
    try {
      const id = uid();
      const res = await fetch(`${SB_URL}/rest/v1/inlets`, {
        method: 'POST',
        headers: {
          apikey: SB_KEY,
          Authorization: `Bearer ${SB_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          id,
          title: title.trim(),
          source_url: sourceUrl.trim() || null,
          excerpt: excerpt.trim() || null,
          mood: mood.trim() || null,
          author: author.trim() || null,
        }),
      });
      if (!res.ok) throw new Error((await res.text()).slice(0, 180) || 'could not save');
      setLink(`${location.origin}/inlet/${id}`);
      setTitle('');
      setSourceUrl('');
      setExcerpt('');
      setMood('');
      await load();
    } catch (e: any) {
      setErr(e?.message || 'could not save');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#070709] text-[#f5f5f7]">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-24 pb-20">
        <p className="text-[12px] tracking-[0.16em] uppercase text-white/40">reading</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">inlet</h1>
        <p className="mt-3 text-[15px] leading-6 text-white/60 max-w-xl">
          A place to keep a line you read. No file required. Paste the source if you want the card to point at it.
        </p>
        <form onSubmit={onSubmit} className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 space-y-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="what you called it" className="w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-[15px] outline-none focus:border-[#0a84ff]/70 transition" />
          <input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https:// source, optional" className="w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-[15px] outline-none focus:border-[#0a84ff]/70 transition" />
          <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="the line you want to keep" rows={4} className="w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-[15px] outline-none focus:border-[#0a84ff]/70 transition resize-y" />
          <div className="grid sm:grid-cols-2 gap-3">
            <input value={mood} onChange={(e) => setMood(e.target.value)} placeholder="mood" className="rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-[15px] outline-none focus:border-[#0a84ff]/70 transition" />
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="your name" className="rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-[15px] outline-none focus:border-[#0a84ff]/70 transition" />
          </div>
          {err && <p className="text-[13px] text-red-300">{err}</p>}
          <button disabled={busy} className="rounded-full bg-white text-black px-5 py-2.5 text-sm font-medium disabled:opacity-50 active:scale-[0.98] transition">{busy ? 'keeping…' : 'keep the line'}</button>
          {link && <p className="text-[13px] text-white/70 break-all">card link <a className="text-[#64d2ff]" href={link}>{link}</a></p>}
        </form>
        <section className="mt-10 space-y-3">
          {rows.map((row) => (
            <article key={row.id} className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-4">
              <h2 className="text-[17px] font-medium tracking-tight">{row.title}</h2>
              {row.excerpt && <p className="mt-2 text-[14px] leading-6 text-white/65">{row.excerpt}</p>}
              <p className="mt-2 text-[12px] text-white/35">{[row.mood, row.author].filter(Boolean).join(' · ')}</p>
              {row.source_url && <a href={row.source_url} className="mt-2 inline-block text-[13px] text-[#64d2ff] break-all">{row.source_url}</a>}
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
