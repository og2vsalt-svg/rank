import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { publishLocalFile } from '../lib/cloudShare';
import { sbRest } from '../lib/supabase';

type Row = {
  id: string;
  share_id: string | null;
  title: string;
  companion: string;
  file_name: string | null;
  file_url: string | null;
  mime: string | null;
  size: number;
  author: string | null;
  created_at: string;
};

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function CrossettePage() {
  const { shareId, navigate } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [companion, setCompanion] = useState('');
  const [author, setAuthor] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');
  const [row, setRow] = useState<Row | null>(null);
  const [recent, setRecent] = useState<Row[]>([]);

  const slow = useMemo(
    () => (file && file.size > 40 * 1024 * 1024 ? 'this drop is large. the tab may feel slow while it sends. nothing is refused for size.' : ''),
    [file],
  );

  const loadRecent = () => {
    sbRest('crossettes?select=*&order=created_at.desc&limit=8')
      .then((r) => r.json())
      .then((data) => setRecent(Array.isArray(data) ? data : []))
      .catch(() => setRecent([]));
  };

  useEffect(() => { loadRecent(); }, []);

  useEffect(() => {
    if (!shareId) return;
    sbRest(`crossettes?id=eq.${encodeURIComponent(shareId)}&select=*&limit=1`)
      .then((r) => r.json())
      .then((data) => setRow(Array.isArray(data) ? data[0] || null : null))
      .catch(() => setRow(null));
  }, [shareId]);

  const fileIt = async () => {
    if (!file || !companion.trim()) return;
    setBusy(true);
    setErr('');
    setWarn('');
    const published = await publishLocalFile(file, {
      caption: companion.trim(),
      author,
      cardTitle: title || file.name,
      meta: { desk: 'crossette' },
    });
    if (!published.ok || !published.id) {
      setBusy(false);
      setErr(published.error || 'could not file that');
      return;
    }
    const res = await sbRest('crossettes', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        id: published.id,
        share_id: published.id,
        title: (title || file.name).slice(0, 160),
        companion: companion.trim().slice(0, 4000),
        file_name: file.name,
        file_url: published.url,
        mime: file.type || 'application/octet-stream',
        size: file.size,
        author: author || null,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      setErr((await res.text()).slice(0, 180));
      return;
    }
    const saved = await res.json();
    const next = Array.isArray(saved) ? saved[0] : null;
    setRow(next);
    const href = `${location.origin}/crossette/${published.id}`;
    setLink(href);
    setWarn(published.warn || slow || '');
    if (next) setRecent((prev) => [next, ...prev.filter((item) => item.id !== next.id)].slice(0, 8));
    history.pushState(null, '', `/crossette/${published.id}`);
  };

  const shown = row;
  const image = shown?.mime?.startsWith('image/') ? shown.file_url : '';

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7]">
      <Navbar />
      <main className="mx-auto max-w-5xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] tracking-[0.16em] uppercase text-white/40">pairing desk</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04, duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="mt-2 text-4xl font-semibold tracking-tight">Crossette</motion.h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/60">Not a vault drawer. A local file is sent to storage and the share table, and a companion line is kept beside it. Paste /crossette/id in Discord for a card. Older desks stay on their routes.</p>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <label className="flex cursor-pointer flex-col items-center rounded-2xl border border-dashed border-white/15 bg-black/20 px-4 py-10 text-center transition duration-200 hover:border-[#0a84ff]/60">
              <span className="text-sm text-white/80">{file ? file.name : 'choose a file from this device'}</span>
              <span className="mt-1 text-xs text-white/40">{file ? pretty(file.size) : 'no size cap'}</span>
              <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </label>
            {slow && <p className="mt-3 text-xs text-amber-200/80">{slow}</p>}
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="pair title" className="mt-4 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-[#0a84ff]" />
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="your name" className="mt-3 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-[#0a84ff]" />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-white/40">companion line</p>
            <textarea value={companion} onChange={(e) => setCompanion(e.target.value)} placeholder="what should sit beside the file" className="mt-3 min-h-48 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-[#0a84ff]" />
            <button disabled={!file || !companion.trim() || busy} onClick={fileIt} className="mt-4 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition duration-200 hover:scale-[1.02] disabled:opacity-40">{busy ? 'pairing…' : 'pair and share'}</button>
            {err && <p className="mt-3 text-sm text-red-300">{err}</p>}
            {warn && <p className="mt-3 text-sm text-amber-200/80">{warn}</p>}
            {link && (
              <button onClick={() => navigator.clipboard.writeText(link)} className="mt-3 block text-left text-sm text-[#7ab6ff]">{link} — copied on click</button>
            )}
          </motion.div>
        </div>

        {shown && (
          <motion.article initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 grid overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] lg:grid-cols-2">
            <div className="p-5">
              {image ? <img src={image} alt="" className="max-h-72 w-full rounded-2xl object-cover" /> : <div className="grid h-40 place-items-center rounded-2xl bg-black/30 text-sm text-white/40">{shown.file_name || 'file'}</div>}
              <p className="mt-3 text-sm text-white/50">{pretty(Number(shown.size) || 0)}</p>
              {shown.file_url && <a href={shown.file_url} className="mt-2 inline-block text-sm text-[#7ab6ff]">download {shown.file_name}</a>}
            </div>
            <div className="border-t border-white/10 p-5 lg:border-l lg:border-t-0">
              <p className="text-xs uppercase tracking-[0.14em] text-white/40">open pair</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">{shown.title}</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-white/75">{shown.companion}</p>
              {shown.author && <p className="mt-3 text-sm text-white/40">{shown.author}</p>}
            </div>
          </motion.article>
        )}

        <ul className="mt-8 space-y-2">
          {recent.map((item) => (
            <li key={item.id}>
              <button onClick={() => navigate('crossette', item.id)} className="flex w-full items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-left text-sm transition duration-200 hover:-translate-y-0.5 hover:bg-white/[0.06]">
                <span>{item.title}</span>
                <span className="text-white/40">{pretty(Number(item.size) || 0)}</span>
              </button>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
