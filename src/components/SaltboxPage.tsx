import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('could not read file'));
    r.readAsDataURL(file);
  });
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

type Row = { name: string; size: number; link?: string; embed?: string; warn?: string; err?: string };

export default function SaltboxPage() {
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);

  const sendMany = async (list: FileList | File[] | null) => {
    if (!list || !list.length) return;
    const files = Array.from(list);
    setBusy(true);
    const next: Row[] = [];
    for (const file of files) {
      const row: Row = { name: file.name, size: file.size };
      if (file.size > 40 * 1024 * 1024) row.warn = 'no cap, but this one may feel sleepy while encoding.';
      try {
        const dataUrl = await readAsDataUrl(file);
        const id = uid();
        const res = await publishShare({
          id,
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl,
        });
        if (!res.ok) throw new Error(res.error || 'share failed');
        const urls = shareUrls(res.id || id);
        row.link = urls.app;
        row.embed = urls.embed;
        if (res.warn) row.warn = res.warn;
      } catch (e: any) {
        row.err = e?.message || 'failed';
      }
      next.push(row);
      setRows([...next]);
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">saltbox</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">stack files, ship each one public.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            not the vault. pick a handful of local files and each one lands in the share db with a discord /s card.
          </p>
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); sendMany(e.dataTransfer.files); }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => sendMany(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'salting…' : 'drop a stack'}</p>
            <p className="text-xs text-neutral-500 mt-2">no hard limit. only a slowness warning when a file is chunky.</p>
          </label>
          <div className="mt-6 space-y-3">
            {rows.map((r, i) => (
              <div key={i} className="rounded-2xl bg-white/[0.03] border border-white/5 px-4 py-3">
                <p className="text-sm text-white">{r.name} · {pretty(r.size)}</p>
                {r.warn && <p className="text-xs text-amber-300/80 mt-1">{r.warn}</p>}
                {r.err && <p className="text-xs text-red-400 mt-1">{r.err}</p>}
                {r.embed && <p className="text-xs text-neutral-400 mt-1 break-all">discord {r.embed}</p>}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
