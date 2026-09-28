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

type Item = {
  file: File;
  status: string;
  embed?: string;
};

export default function CoppicePage() {
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');

  const add = (list: FileList | File[] | null) => {
    if (!list || !list.length) return;
    const files = Array.from(list);
    setWarn(files.some((f) => f.size > 40 * 1024 * 1024) ? 'some of these are heavy. no cap, just might encode slow.' : '');
    setItems((prev) => [...prev, ...files.map((file) => ({ file, status: 'waiting' }))]);
  };

  const shipOne = async (index: number) => {
    const item = items[index];
    if (!item) return;
    setBusy(true);
    setItems((prev) => prev.map((row, i) => (i === index ? { ...row, status: 'shipping' } : row)));
    try {
      const dataUrl = await readAsDataUrl(item.file);
      const id = crypto.randomUUID().slice(0, 10);
      const res = await publishShare({
        id,
        name: item.file.name,
        type: item.file.type || 'application/octet-stream',
        size: item.file.size,
        dataUrl,
      });
      const embed = shareUrls(res.id || id).embed;
      setItems((prev) =>
        prev.map((row, i) =>
          i === index
            ? { ...row, status: res.ok ? 'live' : res.error || 'failed', embed: res.ok ? embed : undefined }
            : row,
        ),
      );
    } catch (e: any) {
      setItems((prev) => prev.map((row, i) => (i === index ? { ...row, status: e?.message || 'failed' } : row)));
    } finally {
      setBusy(false);
    }
  };

  const total = items.reduce((n, row) => n + row.file.size, 0);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">coppice</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a little stand of files. publish one at a time.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            not a vault dump. collect local files here, then send the ones you actually want into the share db.
          </p>
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              add(e.dataTransfer.files);
            }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => add(e.target.files)} />
            <p className="text-white font-medium">drop a handful</p>
            <p className="text-xs text-neutral-500 mt-2">no hard limit. {items.length} waiting · {pretty(total)}</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          <div className="mt-6 space-y-2">
            {items.map((row, i) => (
              <div key={row.file.name + i} className="rounded-2xl bg-white/[0.04] border border-white/8 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{row.file.name}</p>
                    <p className="text-xs text-neutral-500">
                      {pretty(row.file.size)} · {row.status}
                    </p>
                  </div>
                  {row.status !== 'live' && (
                    <button
                      onClick={() => shipOne(i)}
                      disabled={busy}
                      className="shrink-0 px-3 py-1.5 rounded-full bg-white text-black text-xs font-medium disabled:opacity-50"
                    >
                      publish
                    </button>
                  )}
                </div>
                {row.embed && <p className="text-xs text-[#0a84ff] break-all mt-2">{row.embed}</p>}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
