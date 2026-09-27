import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(1) + ' mb';
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('could not read file'));
    r.readAsDataURL(file);
  });
}

type Row = { name: string; size: number; id?: string; embed?: string; error?: string };

export default function PackhorsePage() {
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [rows, setRows] = useState<Row[]>([]);

  const send = async (list: FileList | null) => {
    if (!list?.length) return;
    const files = [...list];
    setWarn(files.some((f) => f.size > 40 * 1024 * 1024) ? 'one of these is heavy. tab might nap while encoding. no cap.' : '');
    setBusy(true);
    const next: Row[] = files.map((f) => ({ name: f.name, size: f.size }));
    setRows(next);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const dataUrl = await readAsDataUrl(file);
        const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        const pub = await publishShare({
          id,
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl,
        });
        next[i] = pub.ok
          ? { name: file.name, size: file.size, id: pub.id || id, embed: shareUrls(pub.id || id).embed }
          : { name: file.name, size: file.size, error: pub.error || 'failed' };
        setRows([...next]);
      } catch (e: any) {
        next[i] = { name: file.name, size: file.size, error: e?.message || 'failed' };
        setRows([...next]);
      }
    }
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
          <p className="text-[#0a84ff] text-sm mb-2">packhorse</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">several locals, each gets a public link.</h1>
          <p className="text-neutral-400 text-sm mb-6">not a zip. every file walks into the share db on its own so discord can unfurl each one.</p>
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); send(e.dataTransfer.files); }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => send(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'walking them over…' : 'drop a pile'}</p>
            <p className="text-xs text-neutral-500 mt-2">no hard limit. only a slowness warning.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          <div className="mt-5 space-y-2">
            {rows.map((r) => (
              <div key={r.name + r.size} className="rounded-2xl bg-white/[0.03] border border-white/5 px-4 py-3">
                <p className="text-sm text-white truncate">{r.name} · {pretty(r.size)}</p>
                {r.embed && <p className="text-[11px] text-neutral-500 break-all mt-1">{r.embed}</p>}
                {r.error && <p className="text-[11px] text-red-400 mt-1">{r.error}</p>}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
