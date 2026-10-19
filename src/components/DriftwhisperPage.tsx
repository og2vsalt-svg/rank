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

export default function DriftwhisperPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [author, setAuthor] = useState('');
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#A5B4FC');
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [copied, setCopied] = useState('');

  const heavy = useMemo(() => files.reduce((n, f) => n + f.size, 0) > 40 * 1024 * 1024, [files]);

  const send = async () => {
    if (!files.length && !caption.trim()) return;
    setBusy(true);
    const next: Row[] = [];
    if (files.length) {
      for (const file of files) {
        const res = await publishLocalFile(file, {
          author,
          caption: caption ? `${caption} · ${file.name}` : file.name,
          color,
          cardTitle: caption || file.name,
          meta: { accent: color, source: 'driftwhisper' },
        });
        next.push({
          name: file.name,
          size: file.size,
          id: res.id,
          embed: res.id ? shareUrls(res.id).embed : undefined,
          error: res.ok ? undefined : res.error,
          warn: res.warn,
        });
        setRows([...next]);
      }
    } else if (caption.trim()) {
      const blob = new Blob([caption], { type: 'text/plain' });
      const file = new File([blob], 'whisper.txt', { type: 'text/plain' });
      const res = await publishLocalFile(file, {
        author,
        caption,
        color,
        cardTitle: caption.slice(0, 80),
        meta: { accent: color, source: 'driftwhisper-note' },
      });
      next.push({
        name: 'quiet note',
        size: blob.size,
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
          {[...Array(16)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${6 + (i * 5.8) % 88}%`,
                top: `${8 + (i * 5.5) % 78}%`,
                width: 5 + (i % 4) * 4,
                height: 5 + (i % 4) * 4,
                background: color,
                opacity: 0.5,
                filter: 'blur(0.8px)',
              }}
              animate={{
                y: [0, -22, 8, -14, 0],
                x: [0, 10, -8, 5, 0],
                opacity: [0.25, 0.65, 0.4, 0.55, 0.3],
                scale: [0.9, 1.15, 0.85, 1.05, 0.95],
              }}
              transition={{
                duration: 7 + (i % 5),
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.18,
              }}
            />
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 105, damping: 22 }} className="relative">
          <p className="text-[12px] uppercase tracking-[0.16em] text-white/45">driftwhisper</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">quiet drifting light points for files and quiet notes</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">
            Multi-file drop or a simple note. Soft points of light that gently drift, pulse, and wander across the space in your color. Spring motion, glass surfaces. Everything lands in storage and the public_shares table. Professional Discord embeds on every link. Large files get only a soft slowness warning — never refused. Prior desks stay fully intact.
          </p>
        </motion.div>

        <label className="glass mt-8 block cursor-pointer rounded-3xl p-8 text-center relative">
          <input className="hidden" type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} />
          <div className="text-[15px] text-white/80">{files.length ? `${files.length} files ready` : 'drop files or leave a note below'}</div>
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
          <textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="shared note or quiet message (works alone or with files)" className="glass rounded-2xl px-4 py-3 text-[14px] outline-none min-h-[80px] resize-none" />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="name, optional" className="glass rounded-2xl px-4 py-3 text-[14px] outline-none" />
          <div className="flex items-center gap-3">
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-14 cursor-pointer rounded-xl border border-white/10 bg-transparent" />
            <span className="text-[13px] text-white/50">accent for the drifting points</span>
          </div>
        </div>

        {heavy && <p className="mt-3 text-[13px] text-amber-200/80">large batch. sending may feel slow. nothing is refused.</p>}

        <motion.button
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.01 }}
          onClick={send}
          disabled={(!files.length && !caption.trim()) || busy}
          className="mt-4 w-full rounded-full px-4 py-3 text-[15px] font-medium text-white disabled:opacity-40"
          style={{ background: color }}
        >
          {busy ? 'drifting…' : 'send the drift'}
        </motion.button>

        {!!rows.length && (
          <div className="mt-6 space-y-2">
            {rows.map((r) => (
              <div key={r.name + (r.size || 0)} className="glass rounded-2xl px-4 py-3">
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
