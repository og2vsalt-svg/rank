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

async function fingerprint(file: File) {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function FuttockPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [forWhom, setForWhom] = useState('');
  const [author, setAuthor] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [drag, setDrag] = useState(false);
  const [filed, setFiled] = useState<{ card: string; share: string; print: string } | null>(null);

  const warn = useMemo(() => {
    if (!file) return '';
    if (file.size > 40 * 1024 * 1024) return 'heavy file. hashing and sending may feel slow. nothing is refused.';
    if (file.size > 12 * 1024 * 1024) return 'large drop. the tab may pause while it fingerprints. still goes up.';
    return '';
  }, [file]);

  const send = async () => {
    if (!file) return;
    setBusy(true);
    setError('');
    setFiled(null);
    let print = '';
    try { print = await fingerprint(file); } catch { print = ''; }
    const shared = await publishLocalFile(file, { caption: note.trim() || undefined, author: author.trim() || undefined, cardTitle: file.name });
    if (!shared.ok || !shared.id) {
      setBusy(false);
      setError(shared.error || 'the share table did not take that file');
      return;
    }
    const rib = await fetch('/api/futtock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shareId: shared.id,
        fileName: file.name,
        fingerprint: print,
        note: note.trim(),
        forWhom: forWhom.trim(),
        author: author.trim(),
        size: file.size,
        mime: file.type,
      }),
    }).then((r) => r.json()).catch(() => ({}));
    setBusy(false);
    if (!rib?.ok) {
      setError(rib?.error || 'file landed, rib note did not');
      setFiled({ card: `${location.origin}/s/${shared.id}`, share: `${location.origin}/s/${shared.id}`, print });
      return;
    }
    setFiled({
      card: `${location.origin}/futtock/${rib.rib.id}`,
      share: `${location.origin}/s/${shared.id}`,
      print,
    });
  };

  const copy = async (value: string) => {
    try { await navigator.clipboard.writeText(value); } catch { setError(value); }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#64d2ff] text-sm font-medium mb-2 tracking-wide">futtock</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mb-3">a rib for the file, not another drawer.</h1>
          <p className="text-neutral-400 max-w-xl mb-8">a local file goes into the share table. the rib keeps a short note and a sha-256 beside it. Discord unfurls /futtock and /s. large files are warned, never refused.</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); const next = e.dataTransfer.files?.[0]; if (next) { setFile(next); setFiled(null); } }}
          className={`glass rounded-3xl p-6 sm:p-8 transition ${drag ? 'ring-2 ring-[#64d2ff]/40' : ''}`}
        >
          <button type="button" onClick={() => inputRef.current?.click()} className="w-full rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-5 py-10 text-left hover:bg-white/[0.05] transition">
            <p className="text-white font-medium">{file ? file.name : 'choose a local file, or drop it here'}</p>
            <p className="text-sm text-neutral-500 mt-1">{file ? pretty(file.size) : 'bytes land in the share table. the rib is the note.'}</p>
          </button>
          <input ref={inputRef} type="file" className="hidden" onChange={(e) => { setFile(e.target.files?.[0] || null); setFiled(null); }} />
          <div className="grid sm:grid-cols-2 gap-3 mt-5">
            <input value={forWhom} onChange={(e) => setForWhom(e.target.value)} placeholder="for whom" className="px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#64d2ff]/50" />
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="your name, optional" className="px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#64d2ff]/50" />
          </div>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="why this rib exists" className="mt-3 w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#64d2ff]/50" />
          {warn && <p className="mt-3 text-xs text-amber-300/90">{warn}</p>}
          {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
          <button disabled={!file || busy} onClick={send} className="mt-5 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">
            {busy ? 'filing…' : 'file the rib'}
          </button>
        </motion.div>
        {filed && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-6 mt-5">
            <p className="text-white font-medium">filed</p>
            <p className="text-xs text-neutral-500 mt-2 break-all">{filed.card}</p>
            {filed.print && <p className="text-xs text-neutral-500 mt-2 break-all">sha-256 {filed.print}</p>}
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
