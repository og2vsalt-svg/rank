import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { useRouter } from './Router';
import { publishLocalFile } from '../lib/cloudShare';

type Take = {
  id: string;
  title: string;
  note: string | null;
  author: string | null;
  file_name: string;
  mime: string | null;
  size: number;
  file_url: string;
  mark_seconds: number | null;
  accent: string | null;
  pretty?: string;
  warn?: string | null;
};

const ease = [0.22, 1, 0.36, 1] as const;

function formatTime(n: number) {
  if (!Number.isFinite(n) || n < 0) return '0:00';
  const s = Math.floor(n % 60).toString().padStart(2, '0');
  return `${Math.floor(n / 60)}:${s}`;
}

export default function ListeningPage() {
  const { shareId, navigate } = useRouter();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [note, setNote] = useState('');
  const [mark, setMark] = useState('0');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');
  const [open, setOpen] = useState<Take | null>(null);
  const [recent, setRecent] = useState<Take[]>([]);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    fetch('/api/listening')
      .then((r) => r.json())
      .then((data) => setRecent(Array.isArray(data.takes) ? data.takes : []))
      .catch(() => {});
  }, [shareId]);

  useEffect(() => {
    if (!shareId) { setOpen(null); return; }
    fetch(`/api/listening?id=${encodeURIComponent(shareId)}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'missing take');
        setOpen(data);
        setWarn(data.warn || '');
        setErr('');
      })
      .catch((error) => setErr(error instanceof Error ? error.message : 'could not open that take'));
  }, [shareId]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el || !open) return;
    const start = Number(open.mark_seconds) || 0;
    const onMeta = () => {
      setDuration(el.duration || 0);
      if (start > 0 && start < (el.duration || Infinity)) el.currentTime = start;
    };
    const onTime = () => setProgress(el.currentTime || 0);
    el.addEventListener('loadedmetadata', onMeta);
    el.addEventListener('timeupdate', onTime);
    return () => {
      el.removeEventListener('loadedmetadata', onMeta);
      el.removeEventListener('timeupdate', onTime);
    };
  }, [open]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { setErr('choose a local file'); return; }
    setBusy(true);
    setErr('');
    setWarn(file.size > 40 * 1024 * 1024 ? 'large take. the browser may feel slow while it sends. it will not be refused.' : '');
    try {
      const published = await publishLocalFile(file, {
        caption: note || title || file.name,
        author,
        cardTitle: title || file.name,
        color: '#0A84FF',
      });
      if (!published.ok || !published.id || !published.url) throw new Error(published.error || 'the file did not land');
      const r = await fetch('/api/listening', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: published.id,
          title: title || file.name,
          note,
          author,
          fileName: file.name,
          mime: file.type,
          size: file.size,
          fileUrl: published.url,
          shareId: published.id,
          markSeconds: Number(mark) || 0,
          accent: '#0A84FF',
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || 'the take did not land');
      setWarn(data.warn || published.warn || '');
      navigate('listening', data.id);
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'listening failed');
    } finally {
      setBusy(false);
    }
  }

  const playable = open && String(open.mime || '').startsWith('audio/') && open.file_url && !open.file_url.startsWith('data:');

  return (
    <div className="mesh min-h-screen text-[#f5f5f7]">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-28 pb-20">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease }} className="text-[13px] tracking-[0.14em] uppercase text-[#8e8e93]">listening</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease }} className="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight">Leave a take.</motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12, duration: 0.5 }} className="mt-4 text-[17px] leading-relaxed text-[#a1a1aa] max-w-xl">A listening desk, not a drawer. The local file lands in storage and the share table, then a take row keeps the title and a start mark. Paste /listening/id in Discord for the card. Large files are warned, never refused.</motion.p>
        {open ? (
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease }} className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <p className="text-sm text-[#8e8e93]">{open.author || 'someone'} left this take</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">{open.title}</h2>
            {open.note ? <p className="mt-3 text-[#d1d1d6]">{open.note}</p> : null}
            <p className="mt-3 text-sm text-[#8e8e93]">{open.file_name} · {open.pretty || `${open.size} bytes`}</p>
            {warn ? <p className="mt-2 text-sm text-[#ffd60a]">{warn}</p> : null}
            {playable ? (
              <div className="mt-5">
                <audio ref={audioRef} src={open.file_url} controls className="w-full" />
                <div className="mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full bg-[#0a84ff] transition-[width] duration-200" style={{ width: duration ? `${Math.min(100, (progress / duration) * 100)}%` : '0%' }} />
                </div>
                <p className="mt-2 text-xs text-[#8e8e93]">{formatTime(progress)} / {formatTime(duration)}{open.mark_seconds ? ` · starts at ${formatTime(Number(open.mark_seconds))}` : ''}</p>
              </div>
            ) : null}
            {open.file_url && !open.file_url.startsWith('data:') ? (
              <a href={open.file_url} className="mt-5 inline-flex rounded-full bg-white text-black px-5 py-2.5 text-sm font-medium active:scale-[0.98] transition" download={open.file_name}>download</a>
            ) : null}
            <button onClick={() => navigate('listening')} className="mt-4 ml-3 text-sm text-[#8e8e93] hover:text-white">leave another</button>
          </motion.section>
        ) : (
          <motion.form initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }} onSubmit={onSubmit} className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-6 space-y-3">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="take title" className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-[#0a84ff] transition" />
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="your name" className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-[#0a84ff] transition" />
            <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={400} placeholder="what should someone hear for" className="w-full min-h-24 rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-[#0a84ff] transition" />
            <input value={mark} onChange={(e) => setMark(e.target.value)} inputMode="decimal" placeholder="start mark, in seconds" className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-[#0a84ff] transition" />
            <label className="block rounded-2xl border border-dashed border-white/15 px-4 py-6 text-sm text-[#a1a1aa] cursor-pointer hover:border-[#0a84ff]/50 transition">
              <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              {file ? file.name : 'choose a local file, audio if you want it to play'}
            </label>
            {warn ? <p className="text-sm text-[#ffd60a]">{warn}</p> : null}
            {err ? <p className="text-sm text-[#ff453a]">{err}</p> : null}
            <button disabled={busy} className="rounded-full bg-white text-black px-5 py-2.5 text-sm font-medium disabled:opacity-60 active:scale-[0.98] transition">{busy ? 'Filing the take…' : 'File the take'}</button>
          </motion.form>
        )}
        <ul className="mt-10 space-y-2">
          {recent.map((row, i) => (
            <motion.li key={row.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.04, duration: 0.35, ease }}>
              <a href={`/listening/${row.id}`} className="block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 hover:bg-white/[0.06] transition">
                <span className="text-white">{row.title || row.file_name}</span>
                <span className="block text-sm text-[#8e8e93]">{row.author || 'someone'}{row.note ? ` · ${row.note}` : ''}</span>
              </a>
            </motion.li>
          ))}
        </ul>
      </main>
      <Footer />
    </div>
  );
}
