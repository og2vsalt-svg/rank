import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import Navbar from './Navbar';
import { useRouter } from './Router';

const ease = [0.22, 1, 0.36, 1] as const;

type Margin = { id: string; body: string; author: string | null; created_at: string };

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function PintlePage() {
  const { shareId } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [author, setAuthor] = useState('');
  const [caption, setCaption] = useState('');
  const [line, setLine] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('file a local drop, then leave a margin on it. the bytes go to the share table. the note goes beside it.');
  const [id, setId] = useState(shareId || '');
  const [margins, setMargins] = useState<Margin[]>([]);
  const [card, setCard] = useState('');

  const slow = useMemo(() => (file && file.size > 12 * 1024 * 1024 ? `${pretty(file.size)}. preview clients may feel slow. the desk still files it.` : ''), [file]);

  async function load(nextId: string) {
    if (!nextId) return;
    const r = await fetch(`/api/margins?shareId=${encodeURIComponent(nextId)}`);
    const data = await r.json();
    if (r.ok) setMargins(Array.isArray(data.margins) ? data.margins : []);
  }

  useEffect(() => {
    if (shareId) {
      setId(shareId);
      setCard(`${window.location.origin}/s/${shareId}`);
      load(shareId).catch(() => setStatus('could not read margins'));
    }
  }, [shareId]);

  async function fileDrop() {
    if (!file) return;
    setBusy(true);
    setStatus('filing the drop');
    try {
      const body = new FormData();
      body.append('file', file, file.name);
      body.append('author', author.trim() || 'pintle');
      body.append('caption', caption.trim() || 'pintle drop');
      body.append('cardTitle', file.name);
      const r = await fetch('/api/share', { method: 'POST', body });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'the share table did not take the file');
      setId(data.id);
      setCard(`${window.location.origin}/s/${data.id}`);
      history.replaceState(null, '', `/pintle/${data.id}`);
      setStatus('filed. the Discord card is ready. margins sit beside the file, not inside the vault.');
      await load(data.id);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'filing failed');
    } finally {
      setBusy(false);
    }
  }

  async function leaveMargin() {
    if (!id || !line.trim()) return;
    setBusy(true);
    try {
      const r = await fetch('/api/margins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shareId: id, body: line.trim(), author: author.trim() || 'pintle' }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'margin was not written');
      setLine('');
      setStatus('margin written next to the drop.');
      await load(id);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'margin failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mesh min-h-screen text-white">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-28 pb-24">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease }} className="text-[#0a84ff] text-[13px] tracking-wide">margin desk</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }} className="mt-3 text-4xl sm:text-5xl font-semibold tracking-tight">pintle</motion.h1>
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.05, ease }} className="mt-4 text-neutral-400 text-lg max-w-xl leading-relaxed">
          The file lands in the share table. Notes land beside it. Paste the card in Discord. Nothing is refused for size.
        </motion.p>

        <label className="mt-8 block rounded-3xl border border-white/10 bg-white/[0.04] p-5 cursor-pointer hover:bg-white/[0.06] transition-colors">
          <span className="text-xs text-neutral-500">local file</span>
          <span className="mt-2 block text-sm text-white truncate">{file ? file.name : 'choose a file on this machine'}</span>
          <span className="mt-1 block text-xs text-neutral-500">{file ? pretty(file.size) : 'no size cutoff'}</span>
          <input type="file" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </label>
        {slow && <p className="mt-3 text-sm text-amber-200/80">{slow}</p>}
        <div className="mt-3 grid sm:grid-cols-2 gap-3">
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="your name" className="rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-white/25 transition-colors" />
          <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="card caption" className="rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-white/25 transition-colors" />
        </div>
        <button disabled={!file || busy} onClick={fileDrop} className="mt-4 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40 active:scale-[0.98] transition-transform">file the drop</button>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <p className="text-xs text-neutral-500">margin on a share</p>
          <input value={id} onChange={(e) => setId(e.target.value.trim())} placeholder="share id" className="mt-3 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-white/25" />
          <textarea value={line} onChange={(e) => setLine(e.target.value)} rows={3} placeholder="a note beside the file" className="mt-3 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-white/25 resize-none" />
          <button disabled={!id || !line.trim() || busy} onClick={leaveMargin} className="mt-3 px-4 py-2 rounded-full bg-white/10 text-sm hover:bg-white/15 disabled:opacity-40">leave the margin</button>
          {card && <a href={card} className="mt-4 block break-all text-[#0a84ff] text-sm">{card}</a>}
          <div className="mt-4 space-y-2">
            {margins.map((m) => (
              <motion.div key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-black/30 px-3 py-2">
                <p className="text-sm text-neutral-100">{m.body}</p>
                <p className="text-xs text-neutral-500 mt-1">{m.author || 'pintle'} · {new Date(m.created_at).toLocaleString()}</p>
              </motion.div>
            ))}
            {!margins.length && <p className="text-sm text-neutral-500">no margins yet.</p>}
          </div>
        </div>
        <p className="mt-4 text-sm text-neutral-400">{status}</p>
      </main>
    </div>
  );
}
