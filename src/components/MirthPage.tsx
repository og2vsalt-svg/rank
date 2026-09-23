import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function formatBytes(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  return (n / (1024 * 1024)).toFixed(2) + ' mb';
}

function tidy(name: string) {
  const parts = name.split('.');
  const ext = parts.length > 1 ? '.' + parts.pop() : '';
  const stem = parts.join('.') || 'file';
  const clean = stem
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return (clean || 'file') + ext.toLowerCase();
}

type Row = { from: string; to: string; size: number; warn?: string };

export default function MirthPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<Row[]>([]);

  const onFiles = (list: FileList | null) => {
    if (!list) return;
    const next = Array.from(list).map((file) => ({
      from: file.name,
      to: tidy(file.name),
      size: file.size,
      warn: file.size > 40 * 1024 * 1024 ? 'large file. rename is instant, share later may feel slow.' : undefined,
    }));
    setRows(next);
  };

  const copy = async () => {
    const text = rows.map((r) => `${r.from} -> ${r.to}`).join('\n');
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">mirth</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">clean names before a drop.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            local rename preview. no upload. copy the map and keep your vault tidy.
          </p>
          <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
          <motion.button
            whileTap={{ scale: 0.985 }}
            onClick={() => inputRef.current?.click()}
            className="w-full rounded-[28px] border border-white/10 bg-white/[0.03] px-6 py-14 text-center hover:bg-white/[0.05] transition-colors"
          >
            <p className="text-white text-sm font-medium">pick local files</p>
            <p className="text-xs text-neutral-500 mt-2">stays on this machine</p>
          </motion.button>
          {rows.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-3">
              {rows.map((r) => (
                <div key={r.from} className="rounded-2xl bg-white/[0.03] border border-white/5 p-4 text-sm">
                  <p className="text-neutral-500 truncate">{r.from}</p>
                  <p className="text-white truncate mt-1">{r.to}</p>
                  <p className="text-xs text-neutral-500 mt-1">{formatBytes(r.size)}</p>
                  {r.warn && <p className="text-amber-300/80 text-xs mt-2">{r.warn}</p>}
                </div>
              ))}
              <button
                onClick={() => void copy()}
                className="w-full rounded-full bg-white text-black text-sm font-medium py-3 hover:bg-neutral-200 transition-colors"
              >
                copy rename map
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
