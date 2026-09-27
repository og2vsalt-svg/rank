import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(2) + ' mb';
}

export default function SparPage() {
  const [file, setFile] = useState<File | null>(null);
  const [warn, setWarn] = useState('');

  const take = (list: FileList | null) => {
    const f = list?.[0] || null;
    setFile(f);
    setWarn(f && f.size > 80 * 1024 * 1024 ? 'big spar. we will not block it — the browser just might lean.' : '');
  };

  const bits = useMemo(() => {
    if (!file) return null;
    const ext = file.name.includes('.') ? file.name.split('.').pop() : '';
    return [
      ['name', file.name],
      ['type', file.type || 'unknown'],
      ['size', pretty(file.size)],
      ['bytes', String(file.size)],
      ['ext', ext || 'none'],
      ['last edited', file.lastModified ? new Date(file.lastModified).toLocaleString() : '—'],
    ];
  }, [file]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">spar</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">hold a file still and look at it.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            no upload. just metadata from your machine. the vault stays out of this room.
          </p>
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); take(e.dataTransfer.files); }}
          >
            <input type="file" className="hidden" onChange={(e) => take(e.target.files)} />
            <p className="text-white font-medium">rest a file on the spar</p>
            <p className="text-xs text-neutral-500 mt-2">stays local. no db write.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          {bits && (
            <dl className="mt-6 space-y-2">
              {bits.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 text-sm border-b border-white/5 pb-2">
                  <dt className="text-neutral-500">{k}</dt>
                  <dd className="text-neutral-200 text-right break-all">{v}</dd>
                </div>
              ))}
            </dl>
          )}
        </motion.div>
      </div>
    </div>
  );
}
