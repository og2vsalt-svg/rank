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

export default function ApostlePage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [spoken, setSpoken] = useState('');
  const [witness, setWitness] = useState('');
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
      caption: spoken.trim() || undefined,
      author: author.trim() || undefined,
      cardTitle: file.name,
    });
    if (!shared.ok || !shared.id) {
      setBusy(false);
      setError(shared.error || 'the share table did not take that file');
      return;
    }
    const row = await fetch('/api/apostle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shareId: shared.id,
        fileName: file.name,
        spoken: spoken.trim(),
        witness: witness.trim(),
        author: author.trim(),
        size: file.size,
        mime: file.type,
      }),
    }).then((r) => r.json()).catch(() => ({}));
    setBusy(false);
    if (!row?.ok) {
      setError(row?.error || 'file landed, spoken line did not');
      setFiled({ card: `${location.origin}/s/${shared.id}`, share: `${location.origin}/s/${shared.id}` });
      return;
    }
    setFiled({ card: `${location.origin}/apostle/${row.apostle.id}`, share: `${location.origin}/s/${shared.id}` });
  };

  const copy = async (value: string) => {
    try { await navigator.clipboard.writeText(value); } catch { /* ignore */ }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="max-w-xl mx-auto px-5 pt-28 pb-24">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[13px] tracking-wide text-[#ffd60a]">apostle</p>
          <h1 className="text-3xl font-semibold text-white mt-2">a timber beside the keel, not a drawer</h1>
          <p className="text-neutral-400 mt-3 text-[15px] leading-relaxed">File a local drop and leave one spoken line with a witness. Not a vault grid. Discord unfurls /apostle and /s. Large files are warned, never refused.</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.5 }} className="glass rounded-3xl p-6 mt-8">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); setFile(e.dataTransfer.files?.[0] || null); setFiled(null); }}
            className={`w-full rounded-2xl border border-dashed px-5 py-10 text-left transition duration-200 ${drag ? 'border-[#ffd60a]/60 bg-white/[0.06]' : 'border-white/15 bg-white/[0.03] hover:bg-white/[0.05]'}`}
          >
            <p className="text-white font-medium">{file ? file.name : 'choose a local file, or drop it here'}</p>
            <p className="text-sm text-neutral-500 mt-1">{file ? pretty(file.size) : 'bytes go to the share table. the apostle is the line.'}</p>
          </button>
          <input ref={inputRef} type="file" className="hidden" onChange={(e) => { setFile(e.target.files?.[0] || null); setFiled(null); }} />
          <div className="grid sm:grid-cols-2 gap-3 mt-5">
            <input value={witness} onChange={(e) => setWitness(e.target.value)} placeholder="who heard it" className="px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#ffd60a]/50 transition" />
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="your name, optional" className="px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#ffd60a]/50 transition" />
          </div>
          <input value={spoken} onChange={(e) => setSpoken(e.target.value)} placeholder="the line that travels with the file" className="mt-3 w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#ffd60a]/50 transition" />
          {warn && <p className="mt-3 text-xs text-amber-300/90">{warn}</p>}
          {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
          <button disabled={!file || busy} onClick={send} className="mt-5 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40 active:scale-[0.98] transition">
            {busy ? 'filing…' : 'file the apostle'}
          </button>
        </motion.div>
        {filed && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-6 mt-5">
            <p className="text-white font-medium">heard</p>
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
