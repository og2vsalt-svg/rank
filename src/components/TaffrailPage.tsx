import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { fetchShare, publishLocalFile, shareUrls } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(2)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

type Note = { id: string; body: string; author?: string | null; created_at?: string };

const ease = [0.22, 1, 0.36, 1] as const;

export default function TaffrailPage() {
  const { shareId } = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [author, setAuthor] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [filedId, setFiledId] = useState<string | null>(shareId);
  const [filedName, setFiledName] = useState('');
  const [warn, setWarn] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [drag, setDrag] = useState(false);

  const slow = useMemo(() => {
    if (!file) return '';
    if (file.size > 80 * 1024 * 1024) return 'heavy file. it still goes up. the tab may feel slow while it sends.';
    if (file.size > 12 * 1024 * 1024) return 'large drop. nothing is refused. preview clients can feel slow.';
    return '';
  }, [file]);

  useEffect(() => {
    if (!filedId) return;
    let stop = false;
    fetchShare(filedId).then((meta) => {
      if (!stop && meta?.name) setFiledName(meta.name);
    });
    fetch(`/api/taffrail?id=${encodeURIComponent(filedId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!stop && Array.isArray(data.notes)) setNotes(data.notes);
      })
      .catch(() => {});
    return () => {
      stop = true;
    };
  }, [filedId]);

  const sendFile = async () => {
    if (!file) return;
    setBusy(true);
    setError('');
    const res = await publishLocalFile(file, {
      caption: caption.trim() || undefined,
      author: author.trim() || undefined,
      cardTitle: file.name,
      color: '#64D2FF',
    });
    setBusy(false);
    if (!res.ok || !res.id) {
      setError(res.error || 'the share table did not take that file');
      return;
    }
    setFiledId(res.id);
    setFiledName(file.name);
    setWarn(res.warn || slow);
    history.replaceState(null, '', `/taffrail/${res.id}`);
  };

  const sendNote = async () => {
    if (!filedId || !note.trim()) return;
    setBusy(true);
    setError('');
    const res = await fetch('/api/taffrail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ share_id: filedId, body: note.trim(), author: author.trim() || null }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error || 'the note did not land');
      return;
    }
    if (data.note) setNotes((prev) => [...prev, data.note]);
    setNote('');
  };

  const links = filedId ? shareUrls(filedId) : null;
  const rail = filedId ? `${location.origin}/taffrail/${filedId}` : '';

  const copy = async (value: string) => {
    try { await navigator.clipboard.writeText(value); } catch { setError(value); }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-24 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease }}>
          <p className="text-[#64d2ff] text-sm font-medium mb-2 tracking-wide">taffrail</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mb-3">a file, then a strip of notes.</h1>
          <p className="text-neutral-400 max-w-xl mb-8">not another drawer. a local file is written into the share table, and short replies live beside it in taffrail notes. Discord cards /taffrail and /s. large files are warned, never refused.</p>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06, duration: 0.5, ease }}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); const next = e.dataTransfer.files?.[0]; if (next) { setFile(next); setFiledId(null); } }}
          className={`glass rounded-[28px] p-6 sm:p-8 ${drag ? 'ring-2 ring-[#64d2ff]/40' : ''}`}
        >
          <button type="button" onClick={() => inputRef.current?.click()} className="w-full rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-5 py-10 text-left hover:bg-white/[0.05] transition-colors">
            <p className="text-white font-medium">{file ? file.name : 'choose a local file, or drop it here'}</p>
            <p className="text-sm text-neutral-500 mt-1">{file ? pretty(file.size) : 'anything the browser can read'}</p>
          </button>
          <input ref={inputRef} type="file" className="hidden" onChange={(e) => { setFile(e.target.files?.[0] || null); setFiledId(null); }} />
          <div className="grid sm:grid-cols-2 gap-3 mt-5">
            <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="caption on the card" className="px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#64d2ff]/50" />
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="your name, optional" className="px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#64d2ff]/50" />
          </div>
          {slow && <p className="mt-3 text-xs text-amber-300/90">{slow}</p>}
          {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
          <button disabled={!file || busy} onClick={sendFile} className="mt-5 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40 active:scale-[0.98] transition-transform">
            {busy ? 'sending…' : 'file it, then open the rail'}
          </button>
        </motion.section>

        {filedId && links && (
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }} className="glass rounded-[28px] p-6 mt-5">
            <p className="text-white font-medium">{filedName || 'filed'} is on the rail</p>
            <p className="text-xs text-neutral-500 mt-1 break-all">{rail}</p>
            {warn && <p className="text-xs text-amber-300/90 mt-2">{warn}</p>}
            <div className="flex flex-wrap gap-2 mt-4">
              <button onClick={() => copy(rail)} className="text-xs px-3 py-1.5 rounded-full bg-white text-black">copy Discord link</button>
              <button onClick={() => copy(links.embed)} className="text-xs px-3 py-1.5 rounded-full bg-white/8 text-white">copy /s card</button>
              <a href={links.embed} className="text-xs px-3 py-1.5 rounded-full bg-white/5 text-white">open file card</a>
            </div>
            <div className="mt-6 space-y-2">
              {notes.length === 0 && <p className="text-sm text-neutral-500">no notes yet. the first one can be yours.</p>}
              {notes.map((item, i) => (
                <motion.div key={item.id || i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="rounded-2xl bg-white/[0.04] border border-white/5 px-4 py-3">
                  <p className="text-sm text-white">{item.body}</p>
                  <p className="text-[11px] text-neutral-500 mt-1">{item.author || 'someone'} · {item.created_at ? new Date(item.created_at).toLocaleString() : 'just now'}</p>
                </motion.div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <input value={note} onChange={(e) => setNote(e.target.value.slice(0, 280))} placeholder="a short note on this file" className="flex-1 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#64d2ff]/50" />
              <button disabled={!note.trim() || busy} onClick={sendNote} className="px-4 py-2.5 rounded-full bg-[#64d2ff] text-black text-sm font-medium disabled:opacity-40">leave it</button>
            </div>
          </motion.section>
        )}
      </main>
    </div>
  );
}
