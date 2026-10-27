import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

export default function SoftLumenRipplePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [author, setAuthor] = useState('');
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [copied, setCopied] = useState('');
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  const heavy = useMemo(() => files.reduce((n, f) => n + f.size, 0) > 40 * 1024 * 1024, [files]);

  const onDrop = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = Array.from(e.target.files || []);
    setFiles(next);
    const rect = e.target.getBoundingClientRect();
    setRipples((r) => [
      ...r,
      { id: Date.now(), x: rect.width / 2, y: rect.height / 2 },
    ]);
  };

  const send = async () => {
    if (!files.length) return;
    setBusy(true);
    const next: Row[] = [];
    for (const file of files) {
      const res = await publishLocalFile(file, {
        author,
        caption: caption ? `${caption} · ${file.name}` : file.name,
        color,
        cardTitle: caption || file.name,
        meta: { accent: color, source: 'softlumenripple' },
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
      <main className="relative mx-auto max-w-2xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 120, damping: 22 }}>
          <p className="text-[12px] uppercase tracking-[0.16em] text-white/45">softlumenripple</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">quiet ripples of shared light</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">
            Drop files and watch soft ripples of your accent expand and settle, like light finding still water. Multi-file share with a shared note. Each file lands in storage and the public_shares table. Professional Discord embeds on every share link. Large files warned only for possible slowness — never refused. Apple-style spring motion and frosted glass. Prior desks remain intact.
          </p>
        </motion.div>

        <label className="glass mt-8 block cursor-pointer rounded-3xl p-8 text-center relative overflow-hidden">
          <input className="hidden" type="file" multiple onChange={onDrop} />
          <div className="text-[15px] text-white/80">{files.length ? `${files.length} files ready` : 'choose files from this machine'}</div>
          <div className="mt-1 text-[12px] text-white/40">any type · no hard cap · soft warning only</div>
          <AnimatePresence>
            {ripples.map((r) => (
              <motion.div
                key={r.id}
                className="absolute rounded-full border pointer-events-none"
                style={{ borderColor: color, left: r.x, top: r.y, width: 40, height: 40, marginLeft: -20, marginTop: -20 }}
                initial={{ scale: 0.4, opacity: 0.6 }}
                animate={{ scale: 6, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                onAnimationComplete={() => setRipples((prev) => prev.filter((p) => p.id !== r.id))}
              />
            ))}
          </AnimatePresence>
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
          <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="shared note that rides every card" className="glass rounded-2xl px-4 py-3 text-[14px] outline-none" />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="name, optional" className="glass rounded-2xl px-4 py-3 text-[14px] outline-none" />
          <div className="flex items-center gap-3">
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-14 cursor-pointer rounded-xl border border-white/10 bg-transparent" />
            <span className="text-[13px] text-white/50">accent for ripples and cards</span>
          </div>
        </div>

        {heavy && <p className="mt-3 text-[13px] text-amber-200/80">large batch. sending may feel slow. nothing is refused.</p>}

        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={send}
          disabled={!files.length || busy}
          className="mt-4 w-full rounded-full px-4 py-3 text-[15px] font-medium text-white disabled:opacity-40"
          style={{ background: color }}
        >
          {busy ? 'sending one by one…' : 'share the quiet ripples'}
        </motion.button>

        {!!rows.length && (
          <div className="mt-6 space-y-2">
            {rows.map((r) => (
              <div key={r.name + r.size} className="glass rounded-2xl px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-[14px]">{r.name}</p>
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
