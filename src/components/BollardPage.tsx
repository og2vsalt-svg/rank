import { useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { publishLocalFile } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(2)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

type Result = {
  id: string;
  name: string;
  size: number;
  url: string;
  embed: string;
  warn: string | null;
};

export default function BollardPage() {
  const { navigate } = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [caption, setCaption] = useState('');
  const [author, setAuthor] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [note, setNote] = useState('');
  const [last, setLast] = useState<Result | null>(null);
  const [copied, setCopied] = useState('');

  const spring = { type: 'spring' as const, stiffness: 420, damping: 34, mass: 0.7 };

  const pace = useMemo(() => {
    if (!note) return '';
    return note;
  }, [note]);

  const send = async (file: File) => {
    setBusy(true);
    setErr('');
    setLast(null);
    const slow = file.size > 25 * 1024 * 1024;
    setNote(slow ? 'large drop. nothing is refused — the browser may pause while the bytes leave.' : 'tying the file to the share table.');
    const out = await publishLocalFile(file, {
      caption: caption.trim() || undefined,
      author: author.trim() || undefined,
      cardTitle: file.name,
      color: '#0A84FF',
    });
    setBusy(false);
    if (!out.ok || !out.id) {
      setErr(out.error || 'the share table did not take the file.');
      setNote('');
      return;
    }
    setLast({
      id: out.id,
      name: file.name,
      size: file.size,
      url: out.url || '',
      embed: out.embed || `${location.origin}/s/${out.id}`,
      warn: out.warn || (slow ? 'large drop. preview clients may feel slow.' : null),
    });
    setNote('');
  };

  const copy = async (value: string, key: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      setTimeout(() => setCopied(''), 1200);
    } catch {
      setErr('clipboard was blocked by the browser.');
    }
  };

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={spring} className="text-[12px] uppercase tracking-[0.16em] text-neutral-500">
          bollard
        </motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.04 }} className="mt-2 text-4xl font-semibold tracking-tight">
          Tie a local file to a public link.
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.08 }} className="mt-3 max-w-xl text-[15px] leading-relaxed text-neutral-400">
          The file leaves this machine, lands in the share store, and gets a row in the share table. Discord, Slack, and X receive a card on the link. Large files are warned, never cut off.
        </motion.p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <label className="block text-[13px] text-neutral-400">
            caption on the card
            <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="optional" className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[15px] text-white outline-none transition focus:border-[#0A84FF]" />
          </label>
          <label className="block text-[13px] text-neutral-400">
            name on the line
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="optional" className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[15px] text-white outline-none transition focus:border-[#0A84FF]" />
          </label>
        </div>

        <motion.button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            const file = e.dataTransfer.files?.[0];
            if (file) send(file);
          }}
          animate={{ scale: drag ? 1.015 : 1, borderColor: drag ? 'rgba(10,132,255,0.8)' : 'rgba(255,255,255,0.08)' }}
          transition={spring}
          className="mt-5 flex w-full flex-col items-center rounded-[28px] border bg-white/[0.03] px-6 py-16 text-center"
        >
          <span className="text-[17px] font-medium">{busy ? 'sending…' : 'Drop a file, or click to choose'}</span>
          <span className="mt-2 text-[13px] text-neutral-500">one file at a time. no size gate.</span>
        </motion.button>
        <input ref={inputRef} type="file" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) send(file); e.target.value = ''; }} />

        <AnimatePresence>
          {pace && (
            <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 text-[13px] text-[#64D2FF]">
              {pace}
            </motion.p>
          )}
          {err && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-[13px] text-[#ff6b6b]">{err}</motion.p>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {last && (
            <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={spring} className="mt-8 overflow-hidden rounded-[28px] border border-white/10 bg-[#111113]">
              <div className="border-b border-white/10 px-5 py-3 text-[12px] uppercase tracking-[0.14em] text-neutral-500">discord card</div>
              <div className="flex gap-4 p-5">
                <div className="w-1 shrink-0 rounded-full bg-[#0A84FF]" />
                <div>
                  <p className="text-[12px] text-neutral-500">rankvault</p>
                  <p className="mt-1 text-[16px] font-semibold">{caption || last.name}</p>
                  <p className="mt-1 text-[13px] text-neutral-400">{pretty(last.size)} · public drop{author ? ` · ${author}` : ''}</p>
                  {last.warn && <p className="mt-2 text-[12px] text-amber-300">{last.warn}</p>}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 border-t border-white/10 px-5 py-4">
                <button onClick={() => copy(last.embed, 'link')} className="rounded-full bg-white px-4 py-2 text-[13px] font-medium text-black">{copied === 'link' ? 'copied' : 'copy share link'}</button>
                <button onClick={() => copy(last.url, 'file')} className="rounded-full bg-white/10 px-4 py-2 text-[13px] text-white">{copied === 'file' ? 'copied' : 'copy file url'}</button>
                <button onClick={() => navigate('share', last.id)} className="rounded-full bg-white/10 px-4 py-2 text-[13px] text-white">open share</button>
                <button onClick={() => navigate('unfurl', last.id)} className="rounded-full bg-white/10 px-4 py-2 text-[13px] text-white">preview card</button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
