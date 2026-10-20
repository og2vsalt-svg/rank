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

export default function QuietfolioPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [author, setAuthor] = useState('');
  const [note, setNote] = useState('');
  const [color, setColor] = useState('#C9A7FF');
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [copied, setCopied] = useState('');

  const heavy = useMemo(() => files.reduce((n, f) => n + f.size, 0) > 40 * 1024 * 1024, [files]);

  const send = async () => {
    setBusy(true);
    const next: Row[] = [];
    if (note.trim()) {
      // Note-only share
      const res = await publishLocalFile(new File([note], 'note.txt', { type: 'text/plain' }), {
        author,
        caption: note,
        color,
        cardTitle: 'quiet note',
        meta: { accent: color, source: 'quietfolio', type: 'note' },
      });
      next.push({
        name: 'note',
        size: note.length,
        id: res.id,
        embed: res.id ? shareUrls(res.id).embed : undefined,
        error: res.ok ? undefined : res.error,
        warn: res.warn,
      });
    }
    for (const file of files) {
      const res = await publishLocalFile(file, {
        author,
        caption: note ? `${note} · ${file.name}` : file.name,
        color,
        cardTitle: note || file.name,
        meta: { accent: color, source: 'quietfolio' },
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
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full blur-3xl"
              style={{
                width: 200 + i * 40,
                height: 200 + i * 40,
                background: color,
                opacity: 0.08,
                left: `${10 + i * 20}%`,
                top: `${25 + i * 10}%`,
              }}
              animate={{
                scale: [1, 1.08, 1],
                opacity: [0.05, 0.12, 0.05],
              }}
              transition={{
                duration: 14 + i * 3,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.8,
              }}
            />
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 110, damping: 20 }} className="relative">
          <p className="text-[12px] uppercase tracking-[0.16em] text-white/45">quietfolio</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">a quiet folio for notes and files</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">
            Write a note first, optionally attach files. Soft breathing light fields that gently expand in your color, like pages of a quiet book. Spring motion, glass surfaces, polished Discord embeds. Notes and files land in storage and the public_shares table. Different from a plain vault — the note is the heart. Large files warned, never refused. Prior features preserved. No traces of boosting.
          </p>
        </motion.div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="write a quiet note…"
          className="glass mt-8 w-full rounded-3xl p-6 text-[15px] outline-none min-h-[120px]"
        />

        <label className="glass mt-4 block cursor-pointer rounded-3xl p-6 text-center relative">
          <input className="hidden" type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} />
          <div className="text-[15px] text-white/80">{files.length ? `${files.length} files ready` : 'optionally attach files'}</div>
          <div className="mt-1 text-[12px] text-white/40">any type · soft warning only · no hard limits</div>
        </label>

        {!!files.length && (
          <ul className="mt-4 space-y-1.5">
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
            <span className="text-[13px] text-white/50">accent for the folio light</span>
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
          {busy ? 'sending…' : 'seal the folio'}
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
