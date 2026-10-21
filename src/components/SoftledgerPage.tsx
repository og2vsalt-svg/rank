import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

type Row = {
  name: string;
  size: number;
  id?: string;
  embed?: string;
  error?: string;
  warn?: string | null;
};

export default function SoftledgerPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [author, setAuthor] = useState('');
  const [note, setNote] = useState('');
  const [color, setColor] = useState('#34C759');
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [copied, setCopied] = useState('');

  const heavy = useMemo(() => files.reduce((n, f) => n + f.size, 0) > 40 * 1024 * 1024, [files]);

  const send = async () => {
    if (!note.trim() && !files.length) return;
    setBusy(true);
    const next: Row[] = [];

    if (note.trim()) {
      const blob = new Blob([note], { type: 'text/plain' });
      const noteFile = new File([blob], 'ledger.txt', { type: 'text/plain' });
      const res = await publishLocalFile(noteFile, {
        author,
        caption: note.slice(0, 150),
        color,
        cardTitle: note.slice(0, 55) || 'a quiet entry',
        meta: { accent: color, source: 'softledger', kind: 'note' },
      });
      next.push({
        name: 'note',
        size: blob.size,
        id: res.id,
        embed: res.id ? shareUrls(res.id).embed : undefined,
        error: res.ok ? undefined : res.error,
        warn: res.warn,
      });
    }

    for (const file of files) {
      const res = await publishLocalFile(file, {
        author,
        caption: note ? `${note.slice(0, 85)} · ${file.name}` : file.name,
        color,
        cardTitle: note.slice(0, 40) || file.name,
        meta: { accent: color, source: 'softledger' },
      });
      next.push({
        name: file.name,
        size: file.size,
        id: res.id,
        embed: res.id ? shareUrls(res.id).embed : undefined,
        error: res.ok ? undefined : res.error,
        warn: res.warn,
      });
    }
    setRows(next);
    setBusy(false);
  };

  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(value);
    setTimeout(() => setCopied(''), 1200);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-10 relative">
        <motion.div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute blur-lg"
              style={{
                width: 4,
                height: 180 + i * 40,
                background: color,
                opacity: 0.15,
                left: `${20 + i * 12}%`,
                top: `${10 + (i % 2) * 30}%`,
                borderRadius: 2,
              }}
              animate={{
                scaleY: [0.8, 1.1, 0.8],
                opacity: [0.1, 0.25, 0.1],
              }}
              transition={{
                duration: 8 + i * 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.5,
              }}
            />
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 105, damping: 19 }} className="relative">
          <p className="text-[12px] uppercase tracking-[0.16em] text-white/45">softledger</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">quiet ledger of light for what you keep</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">
            Write a note first, optionally attach files. Soft vertical columns of light that gently rise and settle in your color, spring motion, glass surfaces. Notes and files land in storage and the public_shares table. Professional Discord embeds on every link. Large files warned, never refused. Prior features preserved. No traces of boosting.
          </p>
        </motion.div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="enter a quiet line..."
          className="glass mt-8 w-full min-h-[140px] resize-none rounded-3xl px-5 py-4 text-[15px] leading-relaxed outline-none"
        />

        <label className="glass mt-4 block cursor-pointer rounded-3xl p-6 text-center relative">
          <input className="hidden" type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} />
          <div className="text-[14px] text-white/80">{files.length ? `${files.length} files ready` : 'optional files from this machine'}</div>
          <div className="mt-1 text-[12px] text-white/40">any type · soft warning only · no hard limits</div>
        </label>

        {!!files.length && (
          <ul className="mt-3 space-y-1.5">
            {files.map((f) => (
              <li key={f.name + f.size} className="flex items-center justify-between rounded-2xl bg-white/[0.04] px-4 py-2.5 text-[13px]">
                <span className="truncate pr-3">{f.name}</span>
                <span className="shrink-0 text-white/40">{(f.size / 1024).toFixed(0)} kb</span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 grid gap-3">
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="name, optional" className="glass rounded-2xl px-4 py-3 text-[14px] outline-none" />
          <div className="flex items-center gap-3">
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-14 cursor-pointer rounded-xl border border-white/10 bg-transparent" />
            <span className="text-[13px] text-white/50">ledger accent</span>
          </div>
        </div>

        {heavy && <p className="mt-3 text-[13px] text-amber-200/80">large batch. sending may feel slow. nothing is refused.</p>}

        <motion.button
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.01 }}
          onClick={send}
          disabled={(!note.trim() && !files.length) || busy}
          className="mt-4 w-full rounded-full px-4 py-3 text-[15px] font-medium text-white disabled:opacity-40"
          style={{ background: color }}
        >
          {busy ? 'recording…' : 'share the entry'}
        </motion.button>

        {!!rows.length && (
          <div className="mt-6 space-y-2">
            {rows.map((r) => (
              <div key={r.name + r.size} className="glass rounded-2xl px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-[14px]">{r.name}</p>
                  {r.embed ? (
                    <button onClick={() => copy(r.embed!)} className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-[12px]">
                      {copied === r.embed ? 'copied' : 'copy link'}
                    </button>
                  ) : (
                    <span className="text-[12px] text-red-300">{r.error || 'failed'}</span>
                  )}
                </div>
                {r.embed && <p className="mt-1 break-all text-[12px] text-white/45">{r.embed}</p>}
                {r.warn && <p className="mt-1 text-[12px] text-amber-200/80">{r.warn}</p>}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
