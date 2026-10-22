import { useState, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function QuietCanvasPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [note, setNote] = useState('');
  const [color, setColor] = useState('#FB7185');
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [warn, setWarn] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const strokes = useMemo(() =>
    Array.from({ length: 6 }, (_, i) => ({
      id: i,
      rotate: -12 + i * 4,
      y: 10 + (i % 3) * 25,
      opacity: 0.1 + (i % 2) * 0.08,
      duration: 5 + i * 0.6,
      delay: i * 0.25,
    })),
  []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const list = Array.from(e.dataTransfer.files);
    if (list.some(f => f.size > 40 * 1024 * 1024)) {
      setWarn('large drop. the browser may feel slow while it sends. no hard limit.');
    } else setWarn(null);
    setFiles(prev => [...prev, ...list]);
  };

  const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files || []);
    if (list.some(f => f.size > 40 * 1024 * 1024)) {
      setWarn('large drop. the browser may feel slow while it sends. no hard limit.');
    } else setWarn(null);
    setFiles(prev => [...prev, ...list]);
  };

  const share = async () => {
    if (!files.length) return;
    setUploading(true);
    const out: any[] = [];
    for (const file of files) {
      const res = await publishLocalFile(file, { caption: note, color, meta: { desk: 'quietcanvas' } });
      if (res.ok) out.push({ ...res, name: file.name });
    }
    setResults(out);
    setFiles([]);
    setUploading(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-28 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
          className="glass rounded-[32px] p-8 mb-8 relative overflow-hidden"
        >
          <div className="absolute inset-0 pointer-events-none">
            {strokes.map((s) => (
              <motion.div
                key={s.id}
                className="absolute left-[5%] right-[5%] h-1.5 rounded-full"
                style={{
                  top: `${s.y}%`,
                  background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
                  opacity: s.opacity,
                  transform: `rotate(${s.rotate}deg)`,
                }}
                animate={{
                  scaleX: [0.7, 1.05, 0.7],
                  opacity: [s.opacity * 0.5, s.opacity, s.opacity * 0.5],
                  x: ['-4%', '4%', '-4%'],
                }}
                transition={{
                  duration: s.duration,
                  delay: s.delay,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#FB7185] mb-2 relative">quietcanvas</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3 relative">quiet painted strokes</h1>
          <p className="text-sm text-neutral-400 leading-relaxed relative">
            Drop files onto a soft painted canvas. Gentle brush strokes of light that breathe, drift, and settle in your color, like quiet marks left on still paper. Spring motion, glass surfaces. Each file lands in storage and the public_shares table. Large files warned, never refused. Professional Discord embeds on every share link. Prior features preserved.
          </p>
        </motion.div>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className="glass rounded-[28px] p-12 text-center cursor-pointer hover:bg-white/[0.04] transition-all duration-500 mb-6"
        >
          <p className="text-neutral-300 text-sm">drop files or click to choose</p>
          <p className="text-xs text-neutral-500 mt-1">multiple welcome — no hard limits</p>
          <input ref={inputRef} type="file" multiple className="hidden" onChange={onSelect} />
        </div>

        {warn && <p className="text-xs text-amber-400/80 mb-4 text-center">{warn}</p>}

        {files.length > 0 && (
          <div className="space-y-2 mb-6">
            {files.map((f, i) => (
              <div key={i} className="glass rounded-2xl px-4 py-3 text-sm flex justify-between">
                <span className="truncate">{f.name}</span>
                <span className="text-neutral-500 text-xs">{(f.size / 1024 / 1024).toFixed(1)} MB</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="shared note…"
            className="glass flex-1 rounded-2xl px-4 py-3 text-sm outline-none"
          />
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-14 h-12 rounded-2xl cursor-pointer bg-transparent border-0"
          />
        </div>

        <button
          onClick={share}
          disabled={!files.length || uploading}
          className="w-full glass rounded-2xl py-3.5 text-sm font-medium disabled:opacity-40 hover:bg-white/10 transition"
        >
          {uploading ? 'settling into the canvas…' : 'share quietly'}
        </button>

        {results.length > 0 && (
          <div className="mt-8 space-y-3">
            {results.map((r) => (
              <motion.a
                key={r.id}
                href={shareUrls(r.id).app}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass rounded-2xl p-4 block hover:bg-white/[0.06] transition"
              >
                <p className="text-sm font-medium">{r.name}</p>
                <p className="text-xs text-neutral-500 mt-1 truncate">{r.embed}</p>
              </motion.a>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
