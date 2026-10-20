import { useState, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function SoftOrbitPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [note, setNote] = useState('');
  const [color, setColor] = useState('#0A84FF');
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [warn, setWarn] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const orbits = useMemo(() => Array.from({ length: 8 }, (_, i) => i), []);

  const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files || []);
    const big = list.some(f => f.size > 40 * 1024 * 1024);
    setWarn(big ? 'large drop. the browser may feel slow while sending. no hard limit — only a gentle warning.' : null);
    setFiles(list);
  };

  const share = async () => {
    if (!files.length && !note.trim()) return;
    setUploading(true);
    const outs: any[] = [];
    const targets = files.length ? files : [new File([note || 'quiet note'], 'note.txt', { type: 'text/plain' })];
    for (const f of targets) {
      const res = await publishLocalFile(f, {
        caption: note,
        color,
        meta: { desk: 'softorbit', orbit: true },
      });
      if (res.ok) outs.push(res);
    }
    setResults(outs);
    setUploading(false);
  };

  return (
    <div className="mesh min-h-screen relative overflow-hidden">
      <Navbar />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {orbits.map(i => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{ width: 6 + (i % 3) * 4, height: 6 + (i % 3) * 4, background: color, boxShadow: `0 0 12px ${color}` }}
            animate={{
              rotate: 360,
              scale: [1, 1.15, 1],
            }}
            transition={{
              rotate: { duration: 18 + i * 2, repeat: Infinity, ease: 'linear' },
              scale: { duration: 3 + i * 0.3, repeat: Infinity, ease: 'easeInOut' },
            }}
            initial={{ x: Math.cos(i) * 120, y: Math.sin(i) * 80 }}
          />
        ))}
      </div>
      <main className="relative max-w-2xl mx-auto px-5 pt-28 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
          className="glass rounded-[28px] p-8 mb-6 backdrop-blur-xl"
        >
          <p className="text-xs uppercase tracking-[0.18em] text-[#0A84FF] mb-2">softorbit</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">quiet orbiting light for what you carry</h1>
          <p className="text-sm text-neutral-400 leading-relaxed">
            Drop one or more files. Add a quiet note and choose an accent. Soft particles orbit gently in your color, breathing with spring motion. Lands in storage and the public_shares table with polished Discord embeds. Large files warned, never refused. Prior desks remain fully intact.
          </p>
        </motion.div>

        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="optional quiet note…"
          className="glass w-full rounded-2xl px-4 py-4 text-sm outline-none min-h-[100px] mb-4"
        />

        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => inputRef.current?.click()}
            className="glass rounded-2xl px-4 py-2.5 text-sm hover:bg-white/5 transition"
          >
            {files.length ? `${files.length} file${files.length > 1 ? 's' : ''}` : 'choose files'}
          </button>
          <input ref={inputRef} type="file" multiple className="hidden" onChange={onSelect} />
          <input
            type="color"
            value={color}
            onChange={e => setColor(e.target.value)}
            className="w-12 h-10 rounded-xl cursor-pointer bg-transparent"
          />
        </div>

        {warn && <p className="text-xs text-amber-400/90 mb-4">{warn}</p>}

        <button
          onClick={share}
          disabled={(!files.length && !note.trim()) || uploading}
          className="w-full glass rounded-2xl py-3.5 text-sm font-medium disabled:opacity-40 hover:bg-white/10 active:scale-[0.98] transition"
        >
          {uploading ? 'sending into orbit…' : 'share'}
        </button>

        {results.length > 0 && (
          <div className="mt-6 space-y-3">
            {results.map(r => (
              <motion.a
                key={r.id}
                href={shareUrls(r.id).app}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-2xl p-4 block hover:bg-white/[0.06] transition"
              >
                <p className="text-sm font-medium">shared</p>
                <p className="text-xs text-neutral-500 mt-1 truncate">{r.embed}</p>
              </motion.a>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
