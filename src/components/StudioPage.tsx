import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';

type Drop = { id: string; sharePath: string; warn: string | null; name: string };

function toB64(buf: ArrayBuffer) {
  const bytes = new Uint8Array(buf);
  let raw = '';
  const step = 0x8000;
  for (let i = 0; i < bytes.length; i += step) {
    raw += String.fromCharCode(...bytes.subarray(i, i + step));
  }
  return btoa(raw);
}

export default function StudioPage() {
  const [caption, setCaption] = useState('');
  const [author, setAuthor] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [warn, setWarn] = useState('');
  const [drop, setDrop] = useState<Drop | null>(null);
  const [progress, setProgress] = useState(0);

  const origin = useMemo(() => (typeof window === 'undefined' ? '' : window.location.origin), []);

  async function send(file: File) {
    setBusy(true);
    setDrop(null);
    setProgress(0);
    setWarn(file.size > 8 * 1024 * 1024 ? 'this one is large. it will still go through, just slower while the pieces walk in.' : '');
    setNote('opening a row…');
    try {
      const opened = await fetch('/api/keep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'open',
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          caption,
          author,
        }),
      }).then((r) => r.json());
      if (!opened.ok) throw new Error(opened.error || 'could not open a row');
      const piece = 380 * 1024;
      const total = Math.max(1, Math.ceil(file.size / piece));
      for (let idx = 0; idx < total; idx += 1) {
        const slice = file.slice(idx * piece, Math.min(file.size, (idx + 1) * piece));
        const payload = toB64(await slice.arrayBuffer());
        const saved = await fetch('/api/keep', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'chunk', id: opened.id, idx, payload }),
        }).then((r) => r.json());
        if (!saved.ok) throw new Error(saved.error || 'a piece did not land');
        setProgress(Math.round(((idx + 1) / total) * 100));
        setNote(`piece ${idx + 1} of ${total}`);
      }
      setDrop({ id: opened.id, sharePath: opened.sharePath, warn: opened.warn, name: file.name });
      setNote('filed.');
    } catch (err) {
      setNote(err instanceof Error ? err.message : 'upload stalled');
    } finally {
      setBusy(false);
    }
  }

  const link = drop ? `${origin}${drop.sharePath}` : '';

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-16 px-5">
        <div className="max-w-2xl mx-auto">
          <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[#0a84ff] text-sm font-medium mb-3">studio</motion.p>
          <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="text-4xl font-semibold tracking-tight text-white mb-3">
            file it into the table.
          </motion.h1>
          <p className="text-neutral-400 leading-relaxed mb-8">
            A local file is cut into pieces and written to the database. No size gate. Large ones only get a heads-up. The share link unfurls in Discord.
          </p>
          <div className="glass rounded-3xl p-5 space-y-4">
            <label className="block">
              <span className="text-xs text-neutral-500">caption</span>
              <input value={caption} onChange={(e) => setCaption(e.target.value)} className="mt-1 w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-[#0a84ff]/50" placeholder="what is this" />
            </label>
            <label className="block">
              <span className="text-xs text-neutral-500">name on the card</span>
              <input value={author} onChange={(e) => setAuthor(e.target.value)} className="mt-1 w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-[#0a84ff]/50" placeholder="optional" />
            </label>
            <label className={`flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-12 text-center cursor-pointer transition hover:border-[#0a84ff]/40 ${busy ? 'opacity-60 pointer-events-none' : ''}`}>
              <span className="text-white font-medium">drop a file, or click</span>
              <span className="text-sm text-neutral-500 mt-1">anything. warned if it may feel slow.</span>
              <input type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) send(f); }} />
            </label>
            {busy && (
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-[#0a84ff] transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            )}
            {warn && <p className="text-sm text-[#ff9f0a]">{warn}</p>}
            {note && <p className="text-sm text-neutral-400">{note}</p>}
            {drop && (
              <div className="rounded-2xl bg-black/30 p-4">
                <p className="text-sm text-white">{drop.name}</p>
                <p className="text-xs text-neutral-500 mt-1 break-all">{link}</p>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => navigator.clipboard.writeText(link)} className="px-3 py-1.5 rounded-full bg-white text-black text-xs font-medium">copy link</button>
                  <a href={drop.sharePath} className="px-3 py-1.5 rounded-full glass text-xs text-neutral-200">open share</a>
                </div>
                {drop.warn && <p className="text-xs text-[#ff9f0a] mt-2">{drop.warn}</p>}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
