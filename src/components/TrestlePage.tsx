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

type Row = { name: string; embed?: string; err?: string };

export default function TrestlePage() {
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [rows, setRows] = useState<Row[]>([]);

  const send = async (list: FileList | null) => {
    if (!list || !list.length) return;
    const files = Array.from(list);
    const heavy = files.some((f) => f.size > 40 * 1024 * 1024);
    setWarn(heavy ? 'one of these spans is chunky. no cap, just a slowness tap.' : '');
    setBusy(true);
    const out: Row[] = [];
    for (const file of files) {
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
        if (!res.ok) out.push({ name: file.name, err: res.error || 'fell off the trestle' });
        else out.push({ name: file.name, embed: shareUrls(id).embed });
      } catch (e: any) {
        out.push({ name: file.name, err: e?.message || 'failed' });
      }
    }
    setRows(out);
    const first = out.find((r) => r.embed)?.embed;
    if (first) {
      try { await navigator.clipboard.writeText(first); } catch {}
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
          <p className="text-[#0a84ff] text-sm mb-2">trestle</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">walk several files across at once.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            multi-select local files. each one lands on the share db with its own discord /s card.
          </p>
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); send(e.dataTransfer.files); }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => send(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'laying the spans…' : 'drop a handful on the trestle'}</p>
            <p className="text-xs text-neutral-500 mt-2">no file count cap. just patience if the pile is huge.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          <div className="mt-5 space-y-2">
            {rows.map((r, i) => (
              <p key={i} className="text-xs text-neutral-400 break-all">
                {r.name} — {r.embed || r.err}
              </p>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
