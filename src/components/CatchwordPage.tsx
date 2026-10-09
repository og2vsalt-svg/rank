import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { publishLocalFile } from '../lib/cloudShare';
import { sbRest } from '../lib/supabase';

type Row = {
  id: string;
  word: string;
  next_line: string | null;
  author: string | null;
  file_name: string | null;
  mime: string | null;
  size: number;
  file_url: string | null;
  created_at: string;
};

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function CatchwordPage() {
  const { shareId } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [word, setWord] = useState('');
  const [nextLine, setNextLine] = useState('');
  const [author, setAuthor] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');
  const [row, setRow] = useState<Row | null>(null);
  const [recent, setRecent] = useState<Row[]>([]);

  const slow = useMemo(
    () => (file && file.size > 40 * 1024 * 1024 ? 'this catchword carries a large file. the tab may feel slow. nothing is refused for size.' : ''),
    [file],
  );

  const loadRecent = () => {
    sbRest('catchwords?select=*&order=created_at.desc&limit=8')
      .then((r) => r.json())
      .then((data) => setRecent(Array.isArray(data) ? data : []))
      .catch(() => setRecent([]));
  };

  useEffect(() => {
    loadRecent();
  }, []);

  useEffect(() => {
    if (!shareId) return;
    sbRest(`catchwords?id=eq.${encodeURIComponent(shareId)}&select=*&limit=1`)
      .then((r) => r.json())
      .then((data) => setRow(Array.isArray(data) ? data[0] || null : null))
      .catch(() => setRow(null));
  }, [shareId]);

  const fileIt = async () => {
    if (!word.trim()) return;
    setBusy(true);
    setErr('');
    setWarn('');
    let published: { ok?: boolean; id?: string; url?: string; error?: string; warn?: string } = { ok: true, id: '' };
    if (file) {
      published = await publishLocalFile(file, {
        caption: nextLine,
        author,
        cardTitle: word.trim(),
      });
      if (!published.ok || !published.id) {
        setBusy(false);
        setErr(published.error || 'could not file that');
        return;
      }
    }
    const id = published.id || Math.random().toString(36).slice(2, 12);
    const res = await sbRest('catchwords', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify({
        id,
        word: word.trim(),
        next_line: nextLine || null,
        author: author || null,
        file_name: file?.name || null,
        mime: file?.type || null,
        size: file?.size || 0,
        file_url: published.url || null,
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
    setLink(`${location.origin}/catchword/${id}`);
    setWarn(published.warn || slow || '');
    if (next) setRecent((prev) => [next, ...prev.filter((item) => item.id !== next.id)].slice(0, 8));
    history.pushState(null, '', `/catchword/${id}`);
  };

  const shown = row;

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] tracking-[0.16em] uppercase text-white/40">
          page foot
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="mt-2 text-4xl font-semibold tracking-tight"
        >
          Catchword
        </motion.h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/60">
          The word at the bottom of a page, hinting at the next. The word is required. A local file is optional and lands in the share table when you attach one. Paste /catchword/id in Discord. Not a vault drawer.
        </p>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <input value={word} onChange={(e) => setWord(e.target.value)} placeholder="the catchword" className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-[#0a84ff]" />
          <textarea value={nextLine} onChange={(e) => setNextLine(e.target.value)} placeholder="the line it points to" className="mt-3 min-h-24 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-[#0a84ff]" />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="your name" className="mt-3 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-[#0a84ff]" />
          <label className="mt-3 flex cursor-pointer flex-col items-center rounded-2xl border border-dashed border-white/15 bg-black/20 px-4 py-8 text-center transition duration-200 hover:border-[#0a84ff]/60">
            <span className="text-sm text-white/80">{file ? file.name : 'optional file from this device'}</span>
            <span className="mt-1 text-xs text-white/40">{file ? pretty(file.size) : 'no size cap'}</span>
            <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
          {slow && <p className="mt-3 text-xs text-amber-200/80">{slow}</p>}
          <button disabled={!word.trim() || busy} onClick={fileIt} className="mt-4 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition duration-200 hover:scale-[1.02] disabled:opacity-40">
            {busy ? 'setting…' : 'set the word'}
          </button>
          {err && <p className="mt-3 text-sm text-red-300">{err}</p>}
          {warn && <p className="mt-3 text-sm text-amber-200/80">{warn}</p>}
          {link && (
            <button onClick={() => navigator.clipboard.writeText(link)} className="mt-3 block text-left text-sm text-[#7ab6ff]">
              {link} — copied on click
            </button>
          )}
        </motion.div>

        {shown && (
          <motion.article layout className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-white/40">next page starts</p>
            <h2 className="mt-1 text-3xl font-semibold tracking-tight">{shown.word}</h2>
            <p className="mt-2 text-sm text-white/60">{shown.next_line || 'no following line'}{shown.author ? ` · ${shown.author}` : ''}</p>
            {shown.file_url && (
              <a href={shown.file_url} className="mt-3 inline-block text-sm text-[#7ab6ff]">
                download {shown.file_name} · {pretty(Number(shown.size) || 0)}
              </a>
            )}
          </motion.article>
        )}

        <ul className="mt-8 space-y-2">
          {recent.map((item) => (
            <li key={item.id}>
              <a href={`/catchword/${item.id}`} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm transition duration-200 hover:-translate-y-0.5 hover:bg-white/[0.06]">
                <span>{item.word}</span>
                <span className="text-white/40">{item.file_name || 'note'}</span>
              </a>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
