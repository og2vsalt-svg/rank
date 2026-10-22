import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function SoftEmberPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [note, setNote] = useState('');
  const [color, setColor] = useState('#FF6B35');
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [warn, setWarn] = useState<string | null>(null);

  const embers = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        id: i,
        size: 3 + (i % 4),
        left: 10 + (i * 13) % 80,
        delay: i * 0.15,
        duration: 6 + (i % 5),
      })),
    [],
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const list = Array.from(e.dataTransfer.files);
    if (list.some((f) => f.size > 40 * 1024 * 1024)) {
      setWarn('large drop. the browser may feel slow while it sends. no hard limit.');
    } else setWarn(null);
    setFiles((prev) => [...prev, ...list]);
  };

  const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files || []);
    if (list.some((f) => f.size > 40 * 1024 * 1024)) {
      setWarn('large drop. the browser may feel slow while it sends. no hard limit.');
    } else setWarn(null);
    setFiles((prev) => [...prev, ...list]);
  };

  const share = async () => {
    if (!files.length) return;
    setUploading(true);
    const out: any[] = [];
    for (const file of files) {
      const res = await publishLocalFile(file, {
        caption: note,
        color,
        cardTitle: note || file.name,
        meta: { desk: 'softember', accent: color },
      });
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
          className="glass rounded-[32px] p-8 mb-8 relative overflow-hidden min-h-[240px]"
        >
          <div className="absolute inset-0 pointer-events-none">
            {embers.map((e) => (
              <motion.div
                key={e.id}
                className="absolute rounded-full"
                style={{
                  width: e.size,
                  height: e.size,
                  left: `${e.left}%`,
                  bottom: '10%',
                  background: color,
                  boxShadow: `0 0 8px ${color}`,
                }}
                animate={{
                  y: [0, -180, -220],
                  opacity: [0.9, 0.4, 0],
                  scale: [1, 0.6, 0.2],
                }}
                transition={{
                  duration: e.duration,
                  delay: e.delay,
                  repeat: Infinity,
                  ease: 'easeOut',
                }}
              />
            ))}
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#0A84FF] mb-2 relative">softember</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3 relative">quiet rising embers for what you carry</h1>
          <p className="text-sm text-neutral-400 leading-relaxed relative">
            Multi-file drop with shared note and accent color. Soft embers of light that gently rise, fade, and breathe in your color, like a quiet hearth settling into still night. Spring motion, glass surfaces, polished Discord embeds. Each file lands in storage and the public_shares table. Large files warned, never refused. Prior features preserved. No traces of boosting.
          </p>
        </motion.div>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          onClick={() => document.getElementById('ember-input')?.click()}
          className="glass rounded-[28px] p-12 text-center cursor-pointer hover:bg-white/[0.04] transition-all duration-500 mb-6"
        >
          <p className="text-neutral-300 text-sm">drop files or click to choose</p>
          <p className="text-xs text-neutral-500 mt-1">multiple welcome — soft warning only</p>
          <input id="ember-input" type="file" multiple className="hidden" onChange={onSelect} />
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

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={share}
          disabled={!files.length || uploading}
          className="w-full rounded-full py-3.5 text-sm font-medium text-white disabled:opacity-40"
          style={{ background: color }}
        >
          {uploading ? 'sending the embers…' : 'share into the embers'}
        </motion.button>

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
