import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { sbRest } from '../lib/supabase';

type Scrap = { id: string; title: string; body: string; author: string | null; accent: string; created_at: string };

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export default function InkstandPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [author, setAuthor] = useState('');
  const [rows, setRows] = useState<Scrap[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');

  const load = async () => {
    const res = await sbRest('inkstand_scraps?select=id,title,body,author,accent,created_at&order=created_at.desc&limit=18');
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data)) setRows(data);
  };

  useEffect(() => { load(); }, []);

  const publish = async () => {
    if (!body.trim()) return;
    setBusy(true);
    setErr('');
    const id = uid();
    try {
      const res = await sbRest('inkstand_scraps', {
        method: 'POST',
        body: JSON.stringify({
          id,
          title: title.trim() || 'untitled scrap',
          body: body.trim(),
          author: author.trim() || null,
          accent: '#0A84FF',
        }),
      });
      if (!res.ok) throw new Error((await res.text()).slice(0, 180) || 'could not save');
      const url = `${window.location.origin}/inkstand/${id}`;
      setLink(url);
      setBody('');
      setTitle('');
      try { await navigator.clipboard.writeText(url); } catch {}
      await load();
    } catch (e: any) {
      setErr(e?.message || 'save failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-3xl mx-auto">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-7 sm:p-9 mb-6"
        >
          <p className="text-[#0A84FF] text-sm mb-2">inkstand</p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">A desk for words, not files.</h1>
          <p className="text-neutral-400 text-sm mt-3 mb-6 max-w-xl">Scraps land in the inkstand table. Paste the link in Discord and it unfurls as a card. Older desks stay where they are.</p>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="title" className="w-full mb-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-[#0A84FF]/50" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={7} placeholder="write the scrap" className="w-full mb-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-[#0A84FF]/50 resize-y" />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="name, if you want one" className="w-full mb-5 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-[#0A84FF]/50" />
          <button onClick={publish} disabled={busy || !body.trim()} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-200 disabled:opacity-50">
            {busy ? 'setting the page…' : 'leave it on the desk'}
          </button>
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {link && <p className="text-xs text-neutral-400 mt-3 break-all">discord card: {link}</p>}
        </motion.section>
        <div className="grid gap-3">
          {rows.map((row, i) => (
            <motion.a
              key={row.id}
              href={`/inkstand/${row.id}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.3), duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="glass lift rounded-3xl p-5 block"
            >
              <p className="text-sm text-white font-medium">{row.title}</p>
              <p className="text-sm text-neutral-400 mt-1 line-clamp-3">{row.body}</p>
              <p className="text-[11px] text-neutral-500 mt-3">{row.author || 'unsigned'} · /inkstand/{row.id}</p>
            </motion.a>
          ))}
        </div>
      </div>
    </div>
  );
}
