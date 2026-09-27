import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { shareUrls } from '../lib/cloudShare';

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

type Row = { name: string; size: number; embed: string; app: string; warn?: string; err?: string };

export default function HearthPage() {
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [warn, setWarn] = useState('');

  const sendMany = async (list: FileList | null) => {
    if (!list?.length) return;
    const files = [...list];
    setWarn(files.some((f) => f.size > 40 * 1024 * 1024) ? 'one of these is huge. no cap, tab might nap while encoding.' : '');
    setBusy(true);
    const next: Row[] = [];
    for (const file of files) {
      try {
        const dataUrl = await readAsDataUrl(file);
        const r = await fetch('/api/share', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: file.name,
            type: file.type || 'application/octet-stream',
            size: file.size,
            dataUrl,
          }),
        });
        const json = await r.json();
        if (!r.ok || !json?.ok) throw new Error(json?.error || 'share failed');
        const urls = shareUrls(json.id);
        next.push({
          name: file.name,
          size: file.size,
          embed: urls.embed,
          app: urls.app,
          warn: json.warn,
        });
      } catch (e: any) {
        next.push({ name: file.name, size: file.size, embed: '', app: '', err: e?.message || 'failed' });
      }
    }
    setRows(next);
    setBusy(false);
  };

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
          <p className="text-[#0a84ff] text-sm mb-2">hearth</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">warm a pile of files into public drops.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            batch ship local files to the share db. each one gets a discord /s card. vault stays out of it.
          </p>
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); sendMany(e.dataTransfer.files); }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => sendMany(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'warming…' : 'drop a few files'}</p>
            <p className="text-xs text-neutral-500 mt-2">no hard limit. only a slowness warning.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {rows.length > 0 && (
            <ul className="mt-6 space-y-3">
              {rows.map((row) => (
                <li key={row.name + row.size} className="rounded-2xl bg-white/[0.03] border border-white/5 px-4 py-3">
                  <p className="text-sm text-white">{row.name} · {pretty(row.size)}</p>
                  {row.err && <p className="text-xs text-red-400 mt-1">{row.err}</p>}
                  {row.embed && <p className="text-xs text-neutral-400 mt-1 break-all">{row.embed}</p>}
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </div>
    </div>
  );
}
