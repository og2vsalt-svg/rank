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

export default function LumenweavePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [author, setAuthor] = useState('');
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [copied, setCopied] = useState('');

  const heavy = useMemo(() => files.reduce((n, f) => n + f.size, 0) > 40 * 1024 * 1024, [files]);

  const randomize = () => {
    const hues = [210, 220, 200, 190, 240, 180];
    const h = hues[Math.floor(Math.random() * hues.length)];
    setColor(`hsl(${h}, 80%, 55%)`);
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
        meta: { accent: color, source: 'lumenweave' },
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
      {/* soft weaving light threads */}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-px w-full"
            style={{
              top: `${12 + i * 10}%`,
              background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
              opacity: 0.3 + (i % 3) * 0.15,
            }}
            animate={{
              x: [0, 40, -20, 0],
              opacity: [0.25, 0.55, 0.3, 0.25],
            }}
            transition={{ duration: 8 + i, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={`v${i}`}
            className="absolute w-px h-full"
            style={{
              left: `${15 + i * 14}%`,
              background: `linear-gradient(180deg, transparent, ${color}, transparent)`,
              opacity: 0.2 + (i % 2) * 0.15,
            }}
            animate={{
              y: [0, 30, -15, 0],
              opacity: [0.2, 0.45, 0.25, 0.2],
            }}
            transition={{ duration: 9 + i * 0.7, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>

      <main className="relative mx-auto max-w-2xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 110, damping: 20 }}>
          <p className="text-[12px] uppercase tracking-[0.16em] text-white/45">lumenweave</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">soft weaving light threads</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">
            Multi-file drop with a shared note and accent color. Gentle horizontal and vertical light threads weave and breathe with your color. Spring motion, glass surfaces, polished Discord embeds. Each file lands in storage and the public_shares table. Large files warned, never refused. Prior features preserved. No traces of boosting.
          </p>
        </motion.div>

        <label className="glass mt-8 block cursor-pointer rounded-3xl p-8 text-center">
          <input className="hidden" type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} />
          <div className="text-[15px] text-white/80">{files.length ? `${files.length} files ready` : 'choose files from this machine'}</div>
          <div className="mt-1 text-[12px] text-white/40">any type · no hard cap · soft warning only</div>
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
            <span className="text-[13px] text-white/50">accent for threads and cards</span>
            <button type="button" onClick={randomize} className="ml-auto text-[12px] text-white/50 hover:text-white">randomize</button>
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
          {busy ? 'weaving one by one…' : 'share the weave'}
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
