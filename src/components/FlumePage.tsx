import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('could not read file'));
    r.readAsDataURL(file);
  });
}

type Row = { name: string; embed: string; warn?: string; err?: string };

export default function FlumePage() {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [warn, setWarn] = useState('');

  const send = async (list: FileList | null) => {
    const files = list ? Array.from(list) : [];
    if (!files.length) return;
    setRows([]);
    setWarn(files.some((f) => f.size > 40 * 1024 * 1024) ? 'one or more files are chunky. the flume may feel sleepy. no hard cap.' : '');
    setBusy(true);
    const next: Row[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProgress(`${i + 1} / ${files.length} — ${file.name}`);
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
        if (!res.ok) {
          next.push({ name: file.name, embed: '', err: res.error || 'failed' });
        } else {
          const urls = shareUrls(id);
          next.push({ name: file.name, embed: urls.embed, warn: res.warn });
        }
      } catch (e: any) {
        next.push({ name: file.name, embed: '', err: e?.message || 'missed the flume' });
      }
      setRows([...next]);
    }
    const lastGood = [...next].reverse().find((r) => r.embed);
    if (lastGood?.embed) {
      try { await navigator.clipboard.writeText(lastGood.embed); } catch {}
    }
    setProgress('');
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
          <p className="text-[#0a84ff] text-sm mb-2">flume</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">one after another. each drop its own card.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            feed a pile through the flume. files publish in order to the share db. not a vault grid.
          </p>
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); send(e.dataTransfer.files); }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => send(e.target.files)} />
            <p className="text-white font-medium">{busy ? progress || 'sliding down…' : 'drop a pile into the flume'}</p>
            <p className="text-xs text-neutral-500 mt-2">no size lock. last good /s link gets copied.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          {rows.length > 0 && (
            <ul className="mt-6 space-y-2">
              {rows.map((r, i) => (
                <li key={i} className="rounded-2xl bg-white/[0.03] border border-white/5 px-4 py-3">
                  <p className="text-sm text-white truncate">{r.name}</p>
                  {r.embed && <p className="text-xs text-neutral-400 break-all mt-1">{r.embed}</p>}
                  {r.warn && <p className="text-xs text-amber-300/80 mt-1">{r.warn}</p>}
                  {r.err && <p className="text-xs text-red-400 mt-1">{r.err}</p>}
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </div>
    </div>
  );
}
