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

type Row = { name: string; embed: string; app: string; warn?: string; error?: string };

export default function JettyPage() {
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [rows, setRows] = useState<Row[]>([]);

  const send = async (list: FileList | null) => {
    if (!list?.length) return;
    const files = [...list];
    const heavy = files.some((f) => f.size > 40 * 1024 * 1024);
    setWarn(heavy ? 'at least one file is huge. this pile may stall the tab. still no cap.' : '');
    setBusy(true);
    const next: Row[] = [];
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
        const urls = shareUrls(id);
        next.push({
          name: file.name,
          embed: urls.embed,
          app: urls.app,
          warn: res.warn,
          error: res.ok ? undefined : res.error,
        });
      } catch (e: any) {
        next.push({ name: file.name, embed: '', app: '', error: e?.message || 'failed' });
      }
      setRows([...next]);
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
          <p className="text-[#0a84ff] text-sm mb-2">jetty</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">tie a pile to the dock.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            each local file becomes its own public share plus a discord /s card. not one zip, not a vault.
          </p>
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); send(e.dataTransfer.files); }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => send(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'tying lines…' : 'drop a pile here'}</p>
            <p className="text-xs text-neutral-500 mt-2">unlimited count. we only warn when the browser might wheeze.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          <div className="mt-6 space-y-3">
            {rows.map((row) => (
              <div key={row.name + row.embed} className="rounded-2xl bg-white/[0.03] border border-white/5 p-4">
                <p className="text-sm text-white truncate">{row.name}</p>
                {row.error && <p className="text-xs text-red-400 mt-1">{row.error}</p>}
                {row.warn && <p className="text-xs text-amber-300/80 mt-1">{row.warn}</p>}
                {row.embed && <p className="text-xs text-neutral-500 break-all mt-1">{row.embed}</p>}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
