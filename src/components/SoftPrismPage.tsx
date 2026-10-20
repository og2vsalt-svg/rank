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

const beams = Array.from({ length: 6 }, (_, i) => ({
  id: i,
  angle: -30 + i * 12,
  delay: i * 0.4,
  width: 80 + i * 20,
}));

export default function SoftPrismPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [author, setAuthor] = useState('');
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#A78BFA');
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
        meta: { accent: color, source: 'softprism' },
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
        {beams.map((b) => (
          <motion.div
            key={b.id}
            className="absolute top-1/2 left-1/2 origin-left rounded-full blur-md opacity-40"
            style={{
              width: `${b.width}px`,
              height: '3px',
              background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
              transform: `rotate(${b.angle}deg)`,
            }}
            animate={{
              scaleX: [0.6, 1.4, 0.8],
              opacity: [0.2, 0.7, 0.3],
              filter: ['blur(4px)', 'blur(8px)', 'blur(4px)'],
            }}
            transition={{
              duration: 4 + b.id * 0.6,
              delay: b.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
      <main className="relative max-w-xl mx-auto px-5 pt-28 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
          className="glass rounded-[28px] p-7"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-white/50 mb-2">softprism</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">light refracted through what you carry</h1>
          <p className="text-sm text-neutral-400 leading-relaxed mb-6">
            Drop local files. Each is refracted into soft prismatic beams of your color. Spring motion, glass surfaces. Lands in storage and the public_shares table. Discord embeds on every link. Large batches warned for possible slowness, never refused. Prior desks stay intact.
          </p>

          <label className="block mb-4">
            <input
              type="file"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
              className="block w-full text-sm text-neutral-300 file:mr-4 file:rounded-full file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-sm file:text-white hover:file:bg-white/15"
            />
          </label>

          {files.length > 0 && (
            <ul className="mb-4 space-y-1 text-sm text-neutral-300">
              {files.map((f) => (
                <li key={f.name + f.size} className="flex justify-between">
                  <span className="truncate">{f.name}</span>
                  <span className="text-white/40">{(f.size / 1024).toFixed(0)} kb</span>
                </li>
              ))}
            </ul>
          )}

          <div className="grid gap-3 mb-4">
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="shared note that rides every prism"
              className="glass rounded-2xl px-4 py-3.5 text-[14px] outline-none"
            />
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="name, optional"
              className="glass rounded-2xl px-4 py-3.5 text-[14px] outline-none"
            />
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-11 w-16 cursor-pointer rounded-xl border border-white/10 bg-transparent"
              />
              <span className="text-[13px] text-white/50">accent for the refracted beams</span>
            </div>
          </div>

          {heavy && (
            <p className="mb-3 text-[13px] text-amber-200/85">
              large batch. sending may feel slow. nothing is refused.
            </p>
          )}

          <motion.button
            whileTap={{ scale: 0.965 }}
            whileHover={{ scale: 1.015 }}
            onClick={send}
            disabled={!files.length || busy}
            className="w-full rounded-full px-4 py-3.5 text-[15px] font-medium text-black disabled:opacity-40"
            style={{ background: color }}
          >
            {busy ? 'refracting…' : 'share the prism'}
          </motion.button>

          {!!rows.length && (
            <div className="mt-7 space-y-2.5">
              {rows.map((r) => (
                <div key={r.name + r.size} className="glass rounded-2xl px-4 py-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-[14px]">{r.name}</p>
                    {r.embed ? (
                      <button
                        onClick={() => copy(r.embed!)}
                        className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-[12px]"
                      >
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
        </motion.div>
      </main>
    </div>
  );
}
