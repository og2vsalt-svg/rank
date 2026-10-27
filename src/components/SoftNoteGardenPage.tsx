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
  isNote?: boolean;
};

export default function SoftNoteGardenPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [color, setColor] = useState('#30D158');
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
      const file = new File([blob], 'quiet-note.txt', { type: 'text/plain' });
      const res = await publishLocalFile(file, {
        author,
        caption: note.slice(0, 120),
        color,
        cardTitle: 'quiet note',
        meta: { accent: color, source: 'softnotegarden', kind: 'note' },
      });
      next.push({
        name: 'quiet note',
        size: blob.size,
        id: res.id,
        embed: res.id ? shareUrls(res.id).embed : undefined,
        error: res.ok ? undefined : res.error,
        warn: res.warn,
        isNote: true,
      });
    }

    for (const file of files) {
      const res = await publishLocalFile(file, {
        author,
        caption: note ? `${note.slice(0, 80)} · ${file.name}` : file.name,
        color,
        cardTitle: file.name,
        meta: { accent: color, source: 'softnotegarden' },
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
    <div className="mesh min-h-screen relative overflow-hidden">
      <Navbar />
      <div className="pointer-events-none absolute inset-0 flex items-end justify-center opacity-40">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="mx-6 mb-12 h-32 w-1 origin-bottom rounded-full"
            style={{ background: color }}
            animate={{ scaleY: [0.6, 1, 0.7], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3 + i, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>
      <main className="relative mx-auto max-w-2xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 120, damping: 22 }}>
          <p className="text-[12px] uppercase tracking-[0.16em] text-white/45">softnotegarden</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">a quiet garden of notes and light</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">
            Leave a note that grows like a soft plant, or plant files as seeds. Optional local attachments. Everything uploads to storage and the public_shares table. Professional Discord embeds on every share link. Soft spring motion, frosted glass. Large files receive only a gentle warning of slowness. Prior desks remain intact.
          </p>
        </motion.div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="a quiet note that settles in the garden…"
          rows={4}
          className="glass mt-8 w-full rounded-3xl px-5 py-4 text-[15px] outline-none resize-none"
        />

        <label className="glass mt-4 block cursor-pointer rounded-3xl p-6 text-center">
          <input className="hidden" type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} />
          <div className="text-[14px] text-white/80">{files.length ? `${files.length} seeds ready` : 'optional files as seeds'}</div>
          <div className="mt-1 text-[12px] text-white/40">any type · no hard cap · soft warning only</div>
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
            <span className="text-[13px] text-white/50">accent for the garden</span>
          </div>
        </div>

        {heavy && <p className="mt-3 text-[13px] text-amber-200/80">large batch. sending may feel slow. nothing is refused.</p>}

        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={send}
          disabled={(!note.trim() && !files.length) || busy}
          className="mt-4 w-full rounded-full px-4 py-3 text-[15px] font-medium text-white disabled:opacity-40"
          style={{ background: color }}
        >
          {busy ? 'planting one by one…' : 'plant in the quiet garden'}
        </motion.button>

        {!!rows.length && (
          <div className="mt-6 space-y-2">
            {rows.map((r) => (
              <div key={r.name + r.size} className="glass rounded-2xl px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-[14px]">{r.isNote ? 'quiet note' : r.name}</p>
                  {r.embed ? (
                    <button onClick={() => copy(r.embed!)} className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-[12px]">
                      {copied === r.embed ? 'copied' : 'copy /s'}
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
