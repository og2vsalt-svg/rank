import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';
import { sbRest } from '../lib/supabase';

type Post = { id: string; headline: string; line: string | null; share_id: string | null; accent: string | null; author: string | null };

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export default function BillboardPage() {
  const [headline, setHeadline] = useState('');
  const [line, setLine] = useState('');
  const [author, setAuthor] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<Post[]>([]);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [error, setError] = useState('');
  const [card, setCard] = useState('');

  async function load() {
    const res = await sbRest('billboard_posts?select=id,headline,line,share_id,accent,author,created_at&order=created_at.desc&limit=16');
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data)) setRows(data);
  }

  useEffect(() => { load(); }, []);

  async function send() {
    setError('');
    setWarn('');
    setCard('');
    if (!headline.trim()) return;
    setBusy(true);
    let shareId: string | null = null;
    if (file) {
      if (file.size > 40 * 1024 * 1024) setWarn('large drop. the browser may feel slow. it still goes through.');
      const published = await publishLocalFile(file, { caption: line.trim(), author: author.trim(), cardTitle: headline.trim(), color: accent });
      if (!published.ok) {
        setBusy(false);
        setError(published.error || 'the file did not land');
        return;
      }
      shareId = published.id || null;
      if (published.warn) setWarn(published.warn);
    }
    const id = uid();
    const res = await sbRest('billboard_posts', {
      method: 'POST',
      body: JSON.stringify({
        id,
        headline: headline.trim().slice(0, 140),
        line: line.trim().slice(0, 400) || null,
        share_id: shareId,
        accent,
        author: author.trim() || null,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      setError('the wall did not take that post.');
      return;
    }
    setCard(`${location.origin}/billboard/${id}`);
    setHeadline('');
    setLine('');
    setFile(null);
    await load();
  }

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="max-w-2xl mx-auto px-5 pt-28 pb-24">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-xs uppercase tracking-[0.18em] text-neutral-500">a wall, not a cabinet</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }} className="mt-2 text-4xl font-semibold tracking-tight text-white">billboard</motion.h1>
        <p className="mt-3 text-neutral-400 text-[15px] leading-relaxed">pin a headline. a local file, if you bring one, lands in the share table. the poster lives beside it. discord unfurls /billboard and /s.</p>
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 24 }} className="glass rounded-3xl p-6 mt-6">
          <div className="h-28 rounded-2xl mb-4 flex items-end p-4" style={{ background: `linear-gradient(160deg, ${accent}, #111)` }}>
            <p className="text-white text-lg font-medium leading-tight">{headline || 'the wall is blank'}</p>
          </div>
          <label className="block text-xs text-neutral-500">headline
            <input value={headline} onChange={(e) => setHeadline(e.target.value)} className="mt-1 w-full bg-white/5 border border-white/10 rounded-2xl px-3 py-2.5 text-sm text-white outline-none focus:border-white/30" />
          </label>
          <label className="block text-xs text-neutral-500 mt-3">line
            <input value={line} onChange={(e) => setLine(e.target.value)} className="mt-1 w-full bg-white/5 border border-white/10 rounded-2xl px-3 py-2.5 text-sm text-white outline-none focus:border-white/30" />
          </label>
          <div className="flex gap-3 mt-3">
            <label className="text-xs text-neutral-500 flex-1">signed
              <input value={author} onChange={(e) => setAuthor(e.target.value)} className="mt-1 w-full bg-white/5 border border-white/10 rounded-2xl px-3 py-2.5 text-sm text-white outline-none" />
            </label>
            <label className="text-xs text-neutral-500">accent
              <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="mt-1 block h-10 w-14 rounded-xl bg-transparent" />
            </label>
          </div>
          <label className="block text-xs text-neutral-500 mt-3">local file, optional
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="mt-1 block w-full text-sm text-neutral-300 file:mr-3 file:rounded-full file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-xs file:text-black" />
          </label>
          {file && <p className="mt-2 text-xs text-neutral-500">{file.name} · {(file.size / (1024 * 1024)).toFixed(2)} MB</p>}
          {warn && <p className="mt-3 text-xs text-amber-200/90">{warn}</p>}
          {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
          <motion.button whileTap={{ scale: 0.98 }} disabled={!headline.trim() || busy} onClick={send} className="mt-5 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">{busy ? 'pinning…' : 'pin it'}</motion.button>
          {card && <p className="mt-3 text-xs text-[#64d2ff] break-all">{card}</p>}
        </motion.div>
        <div className="mt-8 grid gap-3">
          {rows.map((row) => (
            <a key={row.id} href={`/billboard/${row.id}`} className="rounded-2xl p-4 border border-white/10 transition duration-200 hover:-translate-y-0.5" style={{ background: `linear-gradient(145deg, ${row.accent || '#0A84FF'}33, rgba(255,255,255,0.03))` }}>
              <p className="text-white font-medium">{row.headline}</p>
              {row.line && <p className="text-sm text-neutral-300 mt-1">{row.line}</p>}
              <p className="text-xs text-neutral-500 mt-2">{row.share_id ? `file ${row.share_id}` : 'poster only'}{row.author ? ` · ${row.author}` : ''}</p>
            </a>
          ))}
        </div>
      </main>
    </div>
  );
}
