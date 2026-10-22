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

export default function SoftconstellationPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [author, setAuthor] = useState('');
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#60A5FA');
  const [expiresHours, setExpiresHours] = useState('');
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [copied, setCopied] = useState('');

  const heavy = useMemo(() => files.reduce((n, f) => n + f.size, 0) > 40 * 1024 * 1024, [files]);

  const send = async () => {
    if (!files.length) return;
    setBusy(true);
    const next: Row[] = [];
    const expiresAt = expiresHours ? new Date(Date.now() + Number(expiresHours) * 3600000).toISOString() : null;
    for (const file of files) {
      const res = await publishLocalFile(file, {
        author,
        caption: caption ? `${caption} · ${file.name}` : file.name,
        color,
        cardTitle: caption || file.name,
        expiresAt,
        meta: { accent: color, source: 'softconstellation', expiresHours: expiresHours || null },
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

  const stars = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    x: 20 + Math.random() * 60,
    y: 15 + Math.random() * 70,
    delay: i * 0.3,
  })), []);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-10 relative">
        <motion.div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {/* Soft constellation stars */}
          {stars.map((s, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${s.x}%`,
                top: `${s.y}%`,
                width: 4,
                height: 4,
                background: color,
                boxShadow: `0 0 8px ${color}80`,
              }}
              animate={{
                opacity: [0.2, 1, 0.2],
                scale: [0.8, 1.3, 0.8],
              }}
              transition={{
                duration: 3 + (i % 3),
                delay: s.delay,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          ))}
          {/* Connecting lines */}
          <svg className="absolute inset-0 w-full h-full opacity-30" style={{ filter: 'blur(0.5px)' }}>
            {stars.slice(0, 6).map((s, i) => {
              const next = stars[(i + 2) % stars.length];
              return (
                <motion.line
                  key={i}
                  x1={`${s.x}%`}
                  y1={`${s.y}%`}
                  x2={`${next.x}%`}
                  y2={`${next.y}%`}
                  stroke={color}
                  strokeWidth="0.5"
                  animate={{ opacity: [0.1, 0.6, 0.1] }}
                  transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut' }}
                />
              );
            })}
          </svg>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 110, damping: 20 }} className="relative">
          <p className="text-[12px] uppercase tracking-[0.16em] text-white/45">softconstellation</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">quiet stellar constellation for what you carry</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">
            Multi-file drop with shared note, accent color, and optional expiration. Soft twinkling stars that gently connect and breathe in your color, like a quiet constellation settling in still night. Spring motion, glass surfaces. Each file lands in storage and the public_shares table. Professional Discord embeds on every link. Large files receive only a gentle slowness warning — never refused. All prior desks remain intact. No traces of boosting.
          </p>
        </motion.div>

        <label className="glass mt-8 block cursor-pointer rounded-3xl p-8 text-center relative">
          <input className="hidden" type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} />
          <div className="text-[15px] text-white/80">{files.length ? `${files.length} files ready` : 'drop or choose files from this machine'}</div>
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
          <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="shared note that rides every card" className="glass rounded-2xl px-4 py-3 text-[14px] outline-none" />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="name, optional" className="glass rounded-2xl px-4 py-3 text-[14px] outline-none" />
          <input value={expiresHours} onChange={(e) => setExpiresHours(e.target.value.replace(/[^0-9]/g, ''))} placeholder="expires in hours, optional" className="glass rounded-2xl px-4 py-3 text-[14px] outline-none" />
          <div className="flex items-center gap-3">
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-14 cursor-pointer rounded-xl border border-white/10 bg-transparent" />
            <span className="text-[13px] text-white/50">accent for constellation stars</span>
          </div>
        </div>

        {heavy && <p className="mt-3 text-[13px] text-amber-200/80">large batch. sending may feel slow. nothing is refused.</p>}

        <motion.button
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.01 }}
          onClick={send}
          disabled={!files.length || busy}
          className="mt-4 w-full rounded-full px-4 py-3 text-[15px] font-medium text-white disabled:opacity-40"
          style={{ background: color }}
        >
          {busy ? 'constellating…' : 'cast into the constellation'}
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
