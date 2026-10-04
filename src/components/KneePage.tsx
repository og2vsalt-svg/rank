import { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(2)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function KneePage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [mate, setMate] = useState('');
  const [angle, setAngle] = useState('');
  const [author, setAuthor] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [drag, setDrag] = useState(false);
  const [filed, setFiled] = useState<{ card: string; share: string } | null>(null);

  const warn = useMemo(() => {
    if (!file) return '';
    if (file.size > 40 * 1024 * 1024) return 'heavy file. the tab may pause while it sends. nothing is refused.';
    if (file.size > 12 * 1024 * 1024) return 'large drop. preview clients may feel slow. still goes up.';
    return '';
  }, [file]);

  const send = async () => {
    if (!file) return;
    setBusy(true);
    setError('');
    setFiled(null);
    const shared = await publishLocalFile(file, {
      caption: angle.trim() || undefined,
      author: author.trim() || undefined,
      cardTitle: file.name,
    });
    if (!shared.ok || !shared.id) {
      setBusy(false);
      setError(shared.error || 'the share table did not take that file');
      return;
    }
    const knee = await fetch('/api/knee', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shareId: shared.id,
        fileName: file.name,
        mate: mate.trim(),
        angleNote: angle.trim(),
        author: author.trim(),
        size: file.size,
        mime: file.type,
      }),
    }).then((r) => r.json()).catch(() => ({}));
    setBusy(false);
    if (!knee?.ok) {
      setError(knee?.error || 'file landed, knee note did not');
      setFiled({ card: `${location.origin}/s/${shared.id}`, share: `${location.origin}/s/${shared.id}` });
      return;
    }
    setFiled({ card: `${location.origin}/knee/${knee.knee.id}`, share: `${location.origin}/s/${shared.id}` });
  };

  const copy = async (value: string) => {
    try { await navigator.clipboard.writeText(value); } catch { setError(value); }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#ffd60a] text-sm font-medium mb-2 tracking-wide">knee</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mb-3">the join between a file and a name.</h1>
          <p className="text-neutral-400 max-w-xl mb-8">a local file lands in the share table. the knee keeps who it braces and why the angle matters. not a vault drawer. Discord unfurls /knee and /s. large files are warned, never refused.</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); const next = e.dataTransfer.files?.[0]; if (next) { setFile(next); setFiled(null); } }}
          className={`glass rounded-3xl p-6 sm:p-8 transition duration-300 ${drag ? 'ring-2 ring-[#ffd60a]/40 scale-[1.01]' : ''}`}
        >
          <button type="button" onClick={() => inputRef.current?.click()} className="w-full rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-5 py-10 text-left hover:bg-white/[0.05] transition duration-200">
            <p className="text-white font-medium">{file ? file.name : 'choose a local file, or drop it here'}</p>
            <p className="text-sm text-neutral-500 mt-1">{file ? pretty(file.size) : 'bytes go to the share table. the knee is the join.'}</p>
          </button>
          <input ref={inputRef} type="file" className="hidden" onChange={(e) => { setFile(e.target.files?.[0] || null); setFiled(null); }} />
          <div className="grid sm:grid-cols-2 gap-3 mt-5">
            <input value={mate} onChange={(e) => setMate(e.target.value)} placeholder="who this braces" className="px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#ffd60a]/50 transition" />
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="your name, optional" className="px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#ffd60a]/50 transition" />
          </div>
          <input value={angle} onChange={(e) => setAngle(e.target.value)} placeholder="why the angle matters" className="mt-3 w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#ffd60a]/50 transition" />
          {warn && <p className="mt-3 text-xs text-amber-300/90">{warn}</p>}
          {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
          <button disabled={!file || busy} onClick={send} className="mt-5 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40 active:scale-[0.98] transition">
            {busy ? 'filing…' : 'file the knee'}
          </button>
        </motion.div>
        {filed && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-6 mt-5">
            <p className="text-white font-medium">filed</p>
            <p className="text-xs text-neutral-500 mt-2 break-all">{filed.card}</p>
            <div className="flex flex-wrap gap-2 mt-4">
              <button onClick={() => copy(filed.card)} className="text-xs px-3 py-1.5 rounded-full bg-white text-black">copy Discord link</button>
              <button onClick={() => copy(filed.share)} className="text-xs px-3 py-1.5 rounded-full bg-white/5 text-white">copy /s card</button>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
