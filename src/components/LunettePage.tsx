import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { publishLocalFile } from '../lib/cloudShare';
import { sbRest } from '../lib/supabase';

type Row = {
  id: string;
  name: string;
  caption: string | null;
  author: string | null;
  mime: string | null;
  file_url: string | null;
  size: number;
  created_at: string;
  meta?: { desk?: string; forWhom?: string; openBy?: string; courtesy?: string; cardTitle?: string } | null;
};

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function LunettePage() {
  const { shareId, navigate } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [forWhom, setForWhom] = useState('');
  const [openBy, setOpenBy] = useState('');
  const [courtesy, setCourtesy] = useState('');
  const [author, setAuthor] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');
  const [row, setRow] = useState<Row | null>(null);
  const [recent, setRecent] = useState<Row[]>([]);

  const slow = useMemo(
    () => (file && file.size > 40 * 1024 * 1024 ? 'this window is large. the tab may feel slow while it sends. nothing is refused for size.' : ''),
    [file],
  );

  const loadRecent = () => {
    sbRest('public_shares?select=id,name,caption,author,mime,file_url,size,created_at,meta&is_public=eq.true&order=created_at.desc&limit=24')
      .then((r) => r.json())
      .then((data) => {
        const rows = Array.isArray(data) ? data : [];
        setRecent(rows.filter((item) => item?.meta?.desk === 'lunette').slice(0, 8));
      })
      .catch(() => setRecent([]));
  };

  useEffect(() => { loadRecent(); }, []);

  useEffect(() => {
    if (!shareId) return;
    sbRest(`public_shares?id=eq.${encodeURIComponent(shareId)}&select=id,name,caption,author,mime,file_url,size,created_at,meta&limit=1`)
      .then((r) => r.json())
      .then((data) => setRow(Array.isArray(data) ? data[0] || null : null))
      .catch(() => setRow(null));
  }, [shareId]);

  const fileIt = async () => {
    if (!file || !forWhom.trim() || !courtesy.trim()) return;
    setBusy(true);
    setErr('');
    setWarn('');
    const published = await publishLocalFile(file, {
      caption: courtesy.trim(),
      author,
      cardTitle: `for ${forWhom.trim()}`,
      color: '#0A84FF',
      meta: { desk: 'lunette', forWhom: forWhom.trim(), openBy: openBy || null, courtesy: courtesy.trim() },
    });
    setBusy(false);
    if (!published.ok || !published.id) {
      setErr(published.error || 'could not open that window');
      return;
    }
    const href = `${location.origin}/lunette/${published.id}`;
    setLink(href);
    setWarn(published.warn || slow || '');
    history.pushState(null, '', `/lunette/${published.id}`);
    const next: Row = {
      id: published.id,
      name: file.name,
      caption: courtesy.trim(),
      author: author || null,
      mime: file.type || null,
      file_url: published.url || null,
      size: file.size,
      created_at: new Date().toISOString(),
      meta: { desk: 'lunette', forWhom: forWhom.trim(), openBy, courtesy: courtesy.trim(), cardTitle: `for ${forWhom.trim()}` },
    };
    setRow(next);
    setRecent((prev) => [next, ...prev.filter((item) => item.id !== next.id)].slice(0, 8));
  };

  const shown = row;
  const image = shown?.mime?.startsWith('image/') ? shown.file_url : '';

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <Navbar />
      <main className="mx-auto max-w-5xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] tracking-[0.16em] uppercase text-black/40">courtesy window</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04, duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="mt-2 text-4xl font-semibold tracking-tight">Lunette</motion.h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-black/60">Not a vault drawer. A local file is sent to storage and the share table, with who it is for and a time they might open it. The time is a note, not a lock. Paste /lunette/id in Discord for a card. Older desks stay.</p>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="rounded-3xl border border-black/8 bg-white p-5 shadow-[0_12px_40px_rgba(0,0,0,0.04)]">
            <label className="flex cursor-pointer flex-col items-center rounded-2xl border border-dashed border-black/15 bg-[#f5f5f7] px-4 py-10 text-center transition duration-200 hover:border-[#0a84ff]/70">
              <span className="text-sm text-black/80">{file ? file.name : 'choose a file from this device'}</span>
              <span className="mt-1 text-xs text-black/40">{file ? pretty(file.size) : 'no size cap'}</span>
              <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </label>
            {slow && <p className="mt-3 text-xs text-amber-700">{slow}</p>}
            <input value={forWhom} onChange={(e) => setForWhom(e.target.value)} placeholder="who this window is for" className="mt-4 w-full rounded-2xl border border-black/10 bg-[#f5f5f7] px-4 py-3 text-sm outline-none transition focus:border-[#0a84ff]" />
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="your name" className="mt-3 w-full rounded-2xl border border-black/10 bg-[#f5f5f7] px-4 py-3 text-sm outline-none transition focus:border-[#0a84ff]" />
            <label className="mt-3 block text-xs text-black/45">might open by
              <input type="datetime-local" value={openBy} onChange={(e) => setOpenBy(e.target.value)} className="mt-1 w-full rounded-2xl border border-black/10 bg-[#f5f5f7] px-4 py-3 text-sm outline-none transition focus:border-[#0a84ff]" />
            </label>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="rounded-3xl border border-black/8 bg-white p-5 shadow-[0_12px_40px_rgba(0,0,0,0.04)]">
            <p className="text-xs uppercase tracking-[0.14em] text-black/40">courtesy</p>
            <textarea value={courtesy} onChange={(e) => setCourtesy(e.target.value)} placeholder="the line that sits under the glass" className="mt-3 min-h-48 w-full rounded-2xl border border-black/10 bg-[#f5f5f7] px-4 py-3 text-sm outline-none transition focus:border-[#0a84ff]" />
            <button disabled={!file || !forWhom.trim() || !courtesy.trim() || busy} onClick={fileIt} className="mt-4 rounded-full bg-[#1d1d1f] px-5 py-2.5 text-sm font-medium text-white transition duration-200 hover:scale-[1.02] disabled:opacity-40">{busy ? 'opening…' : 'open the window'}</button>
            {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
            {warn && <p className="mt-3 text-sm text-amber-700">{warn}</p>}
            {link && (
              <button onClick={() => navigator.clipboard.writeText(link)} className="mt-3 block text-left text-sm text-[#0a84ff]">{link} — copied on click</button>
            )}
          </motion.div>
        </div>

        {shown && (
          <motion.article initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 grid overflow-hidden rounded-3xl border border-black/8 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.04)] lg:grid-cols-2">
            <div className="p-5">
              {image ? <img src={image} alt="" className="max-h-72 w-full rounded-2xl object-cover" /> : <div className="grid h-40 place-items-center rounded-2xl bg-[#f5f5f7] text-sm text-black/40">{shown.name || 'file'}</div>}
              <p className="mt-3 text-sm text-black/50">{pretty(Number(shown.size) || 0)}</p>
              {shown.file_url && <a href={shown.file_url} className="mt-2 inline-block text-sm text-[#0a84ff]">download {shown.name}</a>}
            </div>
            <div className="border-t border-black/8 p-5 lg:border-l lg:border-t-0">
              <p className="text-xs uppercase tracking-[0.14em] text-black/40">for {shown.meta?.forWhom || 'someone'}</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">{shown.meta?.cardTitle || shown.name}</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-black/75">{shown.meta?.courtesy || shown.caption}</p>
              {shown.meta?.openBy && <p className="mt-3 text-sm text-black/45">might open by {shown.meta.openBy.replace('T', ' ')}</p>}
              {shown.author && <p className="mt-2 text-sm text-black/40">{shown.author}</p>}
            </div>
          </motion.article>
        )}

        <ul className="mt-8 space-y-2">
          {recent.map((item) => (
            <li key={item.id}>
              <button onClick={() => navigate('lunette', item.id)} className="flex w-full items-center justify-between rounded-2xl border border-black/8 bg-white px-4 py-3 text-left text-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.05)]">
                <span>for {item.meta?.forWhom || item.name}</span>
                <span className="text-black/40">{pretty(Number(item.size) || 0)}</span>
              </button>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
