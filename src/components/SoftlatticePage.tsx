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

const nodes = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  x: 8 + (i * 13) % 84,
  y: 12 + (i * 19) % 76,
  delay: i * 0.12,
  size: 8 + (i % 4) * 3,
}));

export default function SoftlatticePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [author, setAuthor] = useState('');
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#64D2FF');
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [copied, setCopied] = useState('');

  const heavy = useMemo(() => files.reduce((n, f) => n + f.size, 0) > 40 * 1024 * 1024, [files]);

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
        meta: { accent: color, source: 'softlattice' },
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
      <div className="pointer-events-none absolute inset-0">
        {nodes.map((n) => (
          <motion.div
            key={n.id}
            className="absolute rounded-full mix-blend-screen"
            style={{
              left: `${n.x}%`,
              top: `${n.y}%`,
              width: n.size,
              height: n.size,
              background: color,
              boxShadow: `0 0 18px ${color}88`,
            }}
            animate={{
              opacity: [0.35, 0.9, 0.45],
              scale: [0.8, 1.3, 0.9],
            }}
            transition={{
              duration: 4.2 + (n.id % 6) * 0.4,
              delay: n.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
        {nodes.slice(0, 12).map((n, i) => {
          const next = nodes[(i + 5) % nodes.length];
          return (
            <motion.div
              key={`line-${n.id}`}
              className="absolute h-px origin-left mix-blend-screen"
              style={{
                left: `${n.x}%`,
                top: `${n.y}%`,
                width: `${Math.hypot(next.x - n.x, next.y - n.y) * 1.1}%`,
                background: `linear-gradient(90deg, ${color}66, transparent)`,
                transform: `rotate(${Math.atan2(next.y - n.y, next.x - n.x) * 180 / Math.PI}deg)`,
              }}
              animate={{ opacity: [0.15, 0.55, 0.2] }}
              transition={{ duration: 5 + i * 0.3, repeat: Infinity, ease: 'easeInOut' }}
            />
          );
        })}
      </div>
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-10 relative">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 110, damping: 24 }}>
          <p className="text-[12px] uppercase tracking-[0.18em] text-white/40">softlattice</p>
          <h1 className="mt-2 text-[36px] font-semibold tracking-[-0.045em]">soft glowing lattice</h1>
          <p className="mt-3 text-[15.5px] leading-relaxed text-white/65">
            Quiet nodes of light connected by faint lines that pulse with your accent. Multi-file drop with a shared note, spring-loaded glass, and professional Discord embeds on every share. Files land in storage and the public_shares table. Large batches only warned for possible slowness. No hard limits. Prior desks preserved. No traces of boosting.
          </p>
        </motion.div>

        <label className="glass mt-8 block cursor-pointer rounded-[28px] p-9 text-center transition hover:bg-white/[0.03]">
          <input className="hidden" type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} />
          <div className="text-[15px] text-white/85">{files.length ? `${files.length} files ready` : 'choose files from this machine'}</div>
          <div className="mt-1.5 text-[12px] text-white/40">any type · no hard cap · soft warning only</div>
        </label>

        {!!files.length && (
          <ul className="mt-4 space-y-1.5">
            {files.map((f) => (
              <li key={f.name + f.size} className="flex items-center justify-between rounded-2xl bg-white/[0.035] px-4 py-2.5 text-[13px]">
                <span className="truncate pr-3">{f.name}</span>
                <span className="shrink-0 text-white/40">{(f.size / 1024).toFixed(0)} kb</span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5 grid gap-3">
          <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="shared note that rides every card" className="glass rounded-2xl px-4 py-3.5 text-[14px] outline-none" />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="name, optional" className="glass rounded-2xl px-4 py-3.5 text-[14px] outline-none" />
          <div className="flex items-center gap-3">
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-11 w-16 cursor-pointer rounded-xl border border-white/10 bg-transparent" />
            <span className="text-[13px] text-white/50">accent for lattice and cards</span>
          </div>
        </div>

        {heavy && <p className="mt-3 text-[13px] text-amber-200/85">large batch. sending may feel slow. nothing is refused.</p>}

        <motion.button
          whileTap={{ scale: 0.965 }}
          whileHover={{ scale: 1.015 }}
          onClick={send}
          disabled={!files.length || busy}
          className="mt-5 w-full rounded-full px-4 py-3.5 text-[15px] font-medium text-white disabled:opacity-40"
          style={{ background: color }}
        >
          {busy ? 'sending one by one…' : 'share the lattice'}
        </motion.button>

        {!!rows.length && (
          <div className="mt-7 space-y-2.5">
            {rows.map((r) => (
              <div key={r.name + r.size} className="glass rounded-2xl px-4 py-3.5">
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
                {r.embed && <p className="mt-1.5 break-all text-[12px] text-white/45">{r.embed}</p>}
                {r.warn && <p className="mt-1 text-[12px] text-amber-200/80">{r.warn}</p>}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
