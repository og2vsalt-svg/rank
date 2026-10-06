import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import Navbar from './Navbar';
import { useRouter } from './Router';

const SB_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SB_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type Row = { id: string; title: string; body: string; author?: string | null; created_at?: string };

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export default function NewelPage() {
  const { shareId, navigate } = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [author, setAuthor] = useState('');
  const [status, setStatus] = useState('a stair note. no file, no size gate.');
  const [link, setLink] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    fetch(`${SB_URL}/rest/v1/newel_notes?select=id,title,body,author,created_at&order=created_at.desc&limit=24`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (live && Array.isArray(data)) setRows(data);
      })
      .catch(() => {});
    if (shareId) {
      setLink(`${location.origin}/newel/${shareId}`);
      fetch(`${SB_URL}/rest/v1/newel_notes?id=eq.${encodeURIComponent(shareId)}&select=title,body,author&limit=1`, {
        headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
      })
        .then((r) => r.json())
        .then((data) => {
          if (!live || !data?.[0]) return;
          setTitle(data[0].title || '');
          setBody(data[0].body || '');
          setAuthor(data[0].author || '');
          setStatus('this note is filed. paste the link in Discord for the card.');
        })
        .catch(() => {});
    }
    return () => {
      live = false;
    };
  }, [shareId]);

  async function leave() {
    if (!title.trim() || !body.trim() || busy) return;
    setBusy(true);
    setStatus('filing the note…');
    try {
      const id = uid();
      const ins = await fetch(`${SB_URL}/rest/v1/newel_notes`, {
        method: 'POST',
        headers: {
          apikey: SB_KEY,
          Authorization: `Bearer ${SB_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({ id, title: title.trim(), body: body.trim(), author: author.trim() || null }),
      });
      if (!ins.ok) {
        const text = await ins.text();
        setStatus(`the note table did not take it: ${text.slice(0, 140)}`);
        return;
      }
      const card = `${location.origin}/newel/${id}`;
      setLink(card);
      setStatus('left on the stair. paste the link in Discord for the card.');
      try { await navigator.clipboard.writeText(card); } catch {}
      navigate('newel', id);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'note failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#070708] text-white">
      <Navbar />
      <main className="mx-auto max-w-xl px-5 pb-24 pt-28">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] uppercase tracking-[0.18em] text-white/40">not a vault</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">newel</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">
            A stair note with no file attached. Older desks stay where they are. Discord unfurls /newel.
          </p>
        </motion.div>
        <div className="mt-8 space-y-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="note title" className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm outline-none placeholder:text-white/30 focus:border-white/25" />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="who left it" className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm outline-none placeholder:text-white/30 focus:border-white/25" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="the note itself" rows={5} className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm outline-none placeholder:text-white/30 focus:border-white/25" />
        </div>
        <p className="mt-4 text-[13px] leading-relaxed text-white/45">{status}</p>
        <button type="button" onClick={leave} disabled={!title.trim() || !body.trim() || busy} className="mt-5 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:bg-neutral-200 disabled:opacity-40">
          {busy ? 'leaving…' : 'leave note'}
        </button>
        {link && (
          <motion.a href={link} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-6 block break-all rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-sky-200">{link}</motion.a>
        )}
        <div className="mt-10 space-y-2">
          {rows.map((row) => (
            <button key={row.id} type="button" onClick={() => navigate('newel', row.id)} className="block w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left transition hover:bg-white/[0.06]">
              <span className="block text-sm text-white">{row.title}</span>
              <span className="mt-0.5 block text-[12px] text-white/40 line-clamp-2">{row.body}</span>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
