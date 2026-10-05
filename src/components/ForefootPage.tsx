import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';

const ease = [0.22, 1, 0.36, 1] as const;
const CHUNK = 480 * 1024;

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function ForefootPage() {
  const { shareId } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState(shareId ? `opening ${shareId}` : 'a local file, written into the database in pieces.');
  const [link, setLink] = useState(shareId ? `${window.location.origin}/forefoot/${shareId}` : '');
  const [fileUrl, setFileUrl] = useState('');

  const slow = useMemo(() => {
    if (!file) return null;
    if (file.size > 40 * 1024 * 1024) return 'heavy file. the tab may pause while it slices and sends. nothing is refused.';
    if (file.size > 12 * 1024 * 1024) return 'large drop. uploading in pieces may feel slow. still goes up.';
    return null;
  }, [file]);

  async function store() {
    if (!file) return;
    setBusy(true);
    setProgress(0);
    setStatus('opening a row…');
    const id = uid();
    try {
      const open = await fetch('/api/forefoot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'open',
          id,
          name: file.name,
          mime: file.type || 'application/octet-stream',
          size: file.size,
          note: note.trim(),
          author: author.trim() || 'forefoot',
        }),
      });
      const opened = await open.json();
      if (!open.ok) throw new Error(opened.error || 'could not open the row');

      const total = Math.max(1, Math.ceil(file.size / CHUNK));
      for (let i = 0; i < total; i++) {
        const slice = file.slice(i * CHUNK, Math.min(file.size, (i + 1) * CHUNK));
        const buf = await slice.arrayBuffer();
        const bytes = new Uint8Array(buf);
        let binary = '';
        const step = 0x8000;
        for (let o = 0; o < bytes.length; o += step) {
          binary += String.fromCharCode(...bytes.subarray(o, o + step));
        }
        const payload = btoa(binary);
        const chunk = await fetch('/api/forefoot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'chunk', id, idx: i, payload }),
        });
        const chunkData = await chunk.json();
        if (!chunk.ok) throw new Error(chunkData.error || `piece ${i + 1} was not written`);
        setProgress(Math.round(((i + 1) / total) * 100));
        setStatus(`piece ${i + 1} of ${total} is in the database`);
      }

      const seal = await fetch('/api/forefoot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'seal', id, chunkCount: total }),
      });
      const sealed = await seal.json();
      if (!seal.ok) throw new Error(sealed.error || 'could not seal the drop');
      setLink(sealed.url);
      setFileUrl(sealed.file);
      setStatus('stored. paste the link in Discord for the card.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'store failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mesh min-h-screen text-white">
      <Navbar />
      <main className="max-w-2xl mx-auto px-5 pt-28 pb-24">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease }} className="text-[13px] tracking-[0.16em] uppercase text-white/45">
          forefoot
        </motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease, delay: 0.04 }} className="mt-3 text-4xl sm:text-5xl font-semibold tracking-[-0.045em]">
          The file itself, in the database.
        </motion.h1>
        <p className="mt-4 text-[17px] leading-relaxed text-white/60">
          Not a link to somewhere else. The bytes from this machine are written in pieces, then sealed into one share. Older desks stay where they are.
        </p>

        <label className="mt-8 block rounded-3xl border border-white/10 bg-white/[0.04] px-5 py-6 cursor-pointer hover:bg-white/[0.07] transition-colors duration-300">
          <span className="text-xs text-white/45">local file</span>
          <span className="mt-2 block text-[15px] truncate">{file ? file.name : 'choose a file on this machine'}</span>
          <span className="mt-1 block text-xs text-white/40">{file ? pretty(file.size) : 'no size cutoff — only a warning if it will feel slow'}</span>
          <input type="file" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </label>
        {slow && <p className="mt-3 text-sm text-amber-200/80">{slow}</p>}
        {busy && (
          <div className="mt-4 h-1 rounded-full bg-white/10 overflow-hidden">
            <motion.div className="h-full bg-white" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.35, ease }} />
          </div>
        )}
        <div className="mt-3 grid sm:grid-cols-2 gap-3">
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="from" className="rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-white/30 transition-colors" />
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="a short note" className="rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-white/30 transition-colors" />
        </div>
        <button disabled={!file || busy} onClick={store} className="mt-4 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40 active:scale-[0.98] transition-transform">
          {busy ? 'writing…' : 'store in the database'}
        </button>
        {link && (
          <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-white/40">share</p>
            <a href={link} className="mt-2 block break-all text-[#0A84FF] text-sm">{link}</a>
            {fileUrl && <a href={fileUrl} className="mt-2 block break-all text-white/70 text-sm">direct file</a>}
            <a href={link.replace('/forefoot/', '/swifter/')} className="mt-2 block text-sm text-white/55">open on swifter</a>
          </div>
        )}
        <p className="mt-4 text-sm text-white/45">{status}</p>
      </main>
    </div>
  );
}
