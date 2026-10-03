import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import Navbar from './Navbar';

const ease = [0.22, 1, 0.36, 1] as const;

type Watch = {
  id: string;
  title: string;
  note?: string | null;
  share_id?: string | null;
  file_name?: string | null;
  created_at?: string;
};

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function CapstanPage() {
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [warn, setWarn] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('a watch on the deck. not another drawer.');
  const [card, setCard] = useState('');
  const [watches, setWatches] = useState<Watch[]>([]);

  async function load() {
    const r = await fetch('/api/capstan');
    const data = await r.json().catch(() => ({}));
    if (r.ok && Array.isArray(data.watches)) setWatches(data.watches);
  }

  useEffect(() => {
    load().catch(() => setStatus('the watch board is quiet right now.'));
  }, []);

  function pick(next: File | null) {
    setFile(next);
    setWarn(next && next.size > 8 * 1024 * 1024 ? 'this drop is heavy. the write can feel slow. it is still accepted.' : '');
  }

  async function publish() {
    if (busy) return;
    if (!title.trim() && !file) {
      setStatus('name the watch, or attach a file.');
      return;
    }
    setBusy(true);
    setStatus('setting the watch…');
    try {
      let shareId = '';
      let fileName = '';
      if (file) {
        const body = new FormData();
        body.append('file', file, file.name);
        body.append('caption', (note || title || 'capstan watch').slice(0, 280));
        body.append('cardTitle', title.trim() || file.name);
        body.append('author', 'capstan');
        body.append('color', '#64D2FF');
        const fr = await fetch('/api/share', { method: 'POST', body });
        const fd = await fr.json();
        if (!fr.ok) throw new Error(fd.error || 'the share table did not take the file');
        shareId = fd.id;
        fileName = file.name;
        if (fd.warn) setWarn(String(fd.warn));
      }
      const r = await fetch('/api/capstan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim() || fileName || 'watch',
          note: note.trim(),
          shareId,
          fileName,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'the watch was not written');
      const origin = window.location.origin;
      const lines = [`${origin}/capstan/${data.id}`];
      if (shareId) lines.push(`${origin}/s/${shareId}`);
      setCard(lines.join('\n'));
      setStatus('set. paste the watch link in Discord for a card.');
      setTitle('');
      setNote('');
      setFile(null);
      await load();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'could not set the watch');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="max-w-xl mx-auto px-5 pt-28 pb-24">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[#64d2ff] text-sm font-medium tracking-wide">capstan</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease }} className="mt-2 text-4xl font-semibold tracking-tight text-white">name the watch.</motion.h1>
        <p className="mt-3 text-neutral-400 leading-relaxed">a short board for who is on, not a file cabinet. if you attach something from this machine, the bytes still land in the share table and unfurl on their own card.</p>
        <div className="mt-8 space-y-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="watch name" className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-[#64d2ff]/60 transition" />
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="what this watch is holding" rows={3} className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-[#64d2ff]/60 transition" />
          <label className="block rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-6 text-center cursor-pointer hover:bg-white/[0.05] transition">
            <input type="file" className="hidden" onChange={(e) => pick(e.target.files?.[0] || null)} />
            <span className="text-white/80">{file ? file.name : 'optional local file'}</span>
            {file && <span className="block mt-1 text-xs text-white/40">{pretty(file.size)}</span>}
          </label>
          {warn && <p className="text-amber-200/90 text-sm">{warn}</p>}
          <button onClick={publish} disabled={busy} className="w-full rounded-full bg-white text-black font-medium py-3 disabled:opacity-40 transition active:scale-[0.99]">
            {busy ? 'setting…' : 'set the watch'}
          </button>
          <p className="text-sm text-white/45">{status}</p>
          {card && (
            <button onClick={() => navigator.clipboard.writeText(card)} className="w-full text-left rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-[#64d2ff] text-sm whitespace-pre-wrap break-all">
              {card}
            </button>
          )}
        </div>
        <div className="mt-10 space-y-2">
          {watches.map((w) => (
            <motion.button
              key={w.id}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease }}
              onClick={() => navigator.clipboard.writeText(`${window.location.origin}/capstan/${w.id}`)}
              className="w-full text-left rounded-2xl bg-white/[0.04] border border-white/8 px-4 py-3 hover:bg-white/[0.07] transition"
            >
              <span className="block text-white">{w.title}</span>
              {w.note && <span className="block mt-1 text-sm text-white/45">{w.note}</span>}
              {w.file_name && <span className="block mt-1 text-xs text-[#64d2ff]">{w.file_name}</span>}
            </motion.button>
          ))}
        </div>
      </main>
    </div>
  );
}
