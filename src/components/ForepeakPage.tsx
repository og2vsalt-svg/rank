import { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(2)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

type Filed = { id: string; name: string; embed: string; warn?: string | null };

export default function ForepeakPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [author, setAuthor] = useState('');
  const [color, setColor] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [filed, setFiled] = useState<Filed | null>(null);
  const [drag, setDrag] = useState(false);

  const warn = useMemo(() => {
    if (!file) return '';
    if (file.size > 80 * 1024 * 1024) return 'this one is heavy. it will still go up, but the tab may feel slow while it sends.';
    if (file.size > 12 * 1024 * 1024) return 'large drop. preview clients can feel slow. nothing is refused.';
    return '';
  }, [file]);

  const send = async () => {
    if (!file) return;
    setBusy(true);
    setError('');
    const res = await publishLocalFile(file, {
      caption: caption.trim() || undefined,
      author: author.trim() || undefined,
      color,
      cardTitle: file.name,
    });
    setBusy(false);
    if (!res.ok || !res.id) {
      setError(res.error || 'the share table did not take that file');
      return;
    }
    const links = shareUrls(res.id);
    setFiled({ id: res.id, name: file.name, embed: res.embed || links.embed, warn: res.warn || warn || null });
  };

  const copy = async (value: string) => {
    try { await navigator.clipboard.writeText(value); } catch { setError(value); }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0a84ff] text-sm font-medium mb-2 tracking-wide">forepeak</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mb-3">file it, then hand someone the card.</h1>
          <p className="text-neutral-400 max-w-xl mb-8">this is not the local vault. a file from this machine is written into the share table, and Discord gets a card on /s. there is no size gate — only a note if the send might feel slow.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); const next = e.dataTransfer.files?.[0]; if (next) { setFile(next); setFiled(null); } }}
          className={`glass rounded-3xl p-6 sm:p-8 transition ${drag ? 'ring-2 ring-[#0a84ff]/50' : ''}`}
        >
          <button type="button" onClick={() => inputRef.current?.click()} className="w-full rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-5 py-10 text-left hover:bg-white/[0.05] transition">
            <p className="text-white font-medium">{file ? file.name : 'choose a local file, or drop it here'}</p>
            <p className="text-sm text-neutral-500 mt-1">{file ? pretty(file.size) : 'images, clips, archives, anything the browser can read'}</p>
          </button>
          <input ref={inputRef} type="file" className="hidden" onChange={(e) => { const next = e.target.files?.[0] || null; setFile(next); setFiled(null); }} />

          <div className="grid sm:grid-cols-2 gap-3 mt-5">
            <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="caption for the card" className="px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#0a84ff]/50" />
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="your name, optional" className="px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#0a84ff]/50" />
          </div>
          <label className="mt-3 flex items-center gap-3 text-sm text-neutral-400">
            accent
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-8 w-10 rounded-lg bg-transparent border-0" />
            <span className="text-xs text-neutral-500">{color}</span>
          </label>
          {warn && <p className="mt-3 text-xs text-amber-300/90">{warn}</p>}
          {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
          <button disabled={!file || busy} onClick={send} className="mt-5 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">
            {busy ? 'sending…' : 'file to the share table'}
          </button>
        </motion.div>

        {filed && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-6 mt-5">
            <p className="text-white font-medium">{filed.name} is filed</p>
            <p className="text-xs text-neutral-500 mt-1 break-all">{filed.embed}</p>
            {filed.warn && <p className="text-xs text-amber-300/90 mt-2">{filed.warn}</p>}
            <div className="flex flex-wrap gap-2 mt-4">
              <button onClick={() => copy(filed.embed)} className="text-xs px-3 py-1.5 rounded-full bg-white text-black">copy Discord link</button>
              <a href={filed.embed} className="text-xs px-3 py-1.5 rounded-full bg-white/5 text-white">open card</a>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
