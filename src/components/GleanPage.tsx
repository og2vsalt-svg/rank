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

export default function GleanPage() {
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [rows, setRows] = useState<{ name: string; embed: string; app: string }[]>([]);

  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    const files = [...list];
    setBusy(true);
    setErr('');
    setWarn(files.some((f) => f.size > 40 * 1024 * 1024) ? 'no cap. large files just make this tab slower while they encode.' : '');
    const next: { name: string; embed: string; app: string }[] = [];
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
        if (!res.ok) {
          setErr(res.error || `could not publish ${file.name}`);
          continue;
        }
        if (res.warn) setWarn(res.warn);
        const urls = shareUrls(res.id || id);
        next.push({ name: file.name, embed: urls.embed, app: urls.app });
      } catch (e: any) {
        setErr(e?.message || 'glean failed');
      }
    }
    setRows((prev) => [...next, ...prev]);
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">glean</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">pick leftovers. ship each one.</h1>
          <p className="text-neutral-400 text-sm mb-6">select locals from disk. each file is written to the share db as its own public drop. discord unfurls /s. not a vault page.</p>
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'gleaning…' : 'drop files to publish'}</p>
            <p className="text-xs text-neutral-500 mt-2">no file limit. just a slowness ping if the batch is huge.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-rose-300/80 mt-3">{err}</p>}
          <ul className="mt-6 space-y-3">
            {rows.map((r) => (
              <li key={r.embed} className="text-sm">
                <p className="text-white">{r.name}</p>
                <p className="text-[#0a84ff] break-all text-xs mt-1">{r.embed}</p>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
