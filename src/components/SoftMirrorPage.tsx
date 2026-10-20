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

const shards = Array.from({ length: 8 }, (_, i) => ({
  id: i,
  x: 10 + (i % 4) * 22,
  y: 15 + Math.floor(i / 4) * 35,
  rot: -15 + (i * 7) % 30,
  delay: i * 0.25,
  scale: 0.7 + (i % 3) * 0.15,
}));

export default function SoftMirrorPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [author, setAuthor] = useState('');
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#C4B5FD');
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
        meta: { accent: color, source: 'softmirror' },
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
        {shards.map((s) => (
          <motion.div
            key={s.id}
            className="absolute rounded-2xl border border-white/20 bg-white/5 backdrop-blur-sm shadow-lg"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: '110px',
              height: '70px',
              transform: `rotate(${s.rot}deg) scale(${s.scale})`,
              background: `linear-gradient(135deg, ${color}22, transparent 60%)`,
            }}
            animate={{
              y: [0, -12, 4, 0],
              rotate: [s.rot, s.rot + 4, s.rot - 3, s.rot],
              opacity: [0.35, 0.65, 0.4],
              scale: [s.scale, s.scale * 1.06, s.scale],
            }}
            transition={{
              duration: 5.5 + s.id * 0.3,
              delay: s.delay,
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
          <p className="text-xs uppercase tracking-[0.2em] text-white/50 mb-2">softmirror</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">quiet reflections of what you carry</h1>
          <p className="text-sm text-neutral-400 leading-relaxed mb-6">
            Drop local files. Each settles into soft mirrored shards that gently float, tilt, and catch light in your color. Spring motion, glass surfaces. Lands in storage and the public_shares table. Discord embeds on every link. Large batches warned for possible slowness, never refused. Prior desks stay intact.
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
              placeholder="shared note that rides every reflection"
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
              <span className="text-[13px] text-white/50">accent for the mirrored shards</span>
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
            {busy ? 'reflecting…' : 'share the mirror'}
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
