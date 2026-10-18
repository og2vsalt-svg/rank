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

const paths = Array.from({ length: 8 }, (_, i) => ({
  id: i,
  delay: i * 0.4,
  length: 40 + (i % 3) * 15,
}));

export default function LumenpathPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [author, setAuthor] = useState('');
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#FF9F0A');
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
        meta: { accent: color, source: 'lumenpath' },
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
        {paths.map((p) => (
          <motion.div
            key={p.id}
            className="absolute h-px"
            style={{
              left: `${10 + (p.id * 11) % 80}%`,
              top: `${20 + (p.id * 9) % 60}%`,
              width: p.length,
              background: `linear-gradient(to right, ${color}00, ${color}, ${color}00)`,
            }}
            animate={{
              x: [0, 20, 0],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 5 + p.id * 0.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: p.delay,
            }}
          />
        ))}
      </div>

      <main className="relative z-10 max-w-xl mx-auto px-5 pt-28 pb-20">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="text-3xl font-semibold text-white tracking-tight mb-2"
        >
          lumenpath
        </motion.h1>
        <p className="text-neutral-400 text-sm mb-8 leading-relaxed">
          Quiet paths of light for what you carry. Multi-file drop with shared note and accent. Soft horizontal trails that drift and breathe with your color. Spring motion, glass surfaces, polished Discord embeds. Large files warned, never refused.
        </p>

        <div className="glass rounded-2xl p-5 mb-6 space-y-4">
          <input
            type="file"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files || []))}
            className="block w-full text-sm text-neutral-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-white/10 file:text-white hover:file:bg-white/20"
          />
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="author (optional)"
            className="w-full bg-transparent border-b border-white/10 py-2 text-sm text-white placeholder:text-neutral-500 outline-none"
          />
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="shared note"
            className="w-full bg-transparent border-b border-white/10 py-2 text-sm text-white placeholder:text-neutral-500 outline-none"
          />
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-10 h-10 rounded-lg bg-transparent border-0 cursor-pointer"
            />
            <span className="text-xs text-neutral-500">accent</span>
          </div>
          {heavy && (
            <p className="text-xs text-amber-400/90">large drop — may feel slow, but never refused</p>
          )}
          <button
            onClick={send}
            disabled={busy || !files.length}
            className="w-full py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40 hover:bg-neutral-200 transition"
          >
            {busy ? 'sending…' : 'path & share'}
          </button>
        </div>

        {rows.length > 0 && (
          <div className="space-y-3">
            {rows.map((r, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-xl p-4 text-sm"
              >
                <div className="text-white mb-1">{r.name}</div>
                {r.error ? (
                  <div className="text-red-400 text-xs">{r.error}</div>
                ) : (
                  <>
                    {r.warn && <div className="text-amber-400/80 text-xs mb-1">{r.warn}</div>}
                    {r.embed && (
                      <button
                        onClick={() => copy(r.embed!)}
                        className="text-xs text-[#FF9F0A] hover:underline"
                      >
                        {copied === r.embed ? 'copied' : 'copy share link'}
                      </button>
                    )}
                  </>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
