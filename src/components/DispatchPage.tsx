import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid(prefix: string) {
  return prefix + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('could not read file'));
    r.readAsDataURL(file);
  });
}

type Row = { name: string; id: string; embed: string; error?: string };

export default function DispatchPage() {
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [rows, setRows] = useState<Row[]>([]);

  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    const files = [...list];
    setWarn(files.some((f) => f.size > 24 * 1024 * 1024) ? 'one or more files are chunky. queue still runs. no hard cap.' : '');
    setBusy(true);
    const next: Row[] = [];
    for (const file of files) {
      try {
        const dataUrl = await readAsDataUrl(file);
        const id = uid('dispatch');
        const res = await publishShare({
          id,
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl,
        });
        if (!res.ok) {
          next.push({ name: file.name, id, embed: '', error: res.error || 'failed' });
          continue;
        }
        const urls = shareUrls(res.id || id);
        next.push({ name: file.name, id: res.id || id, embed: urls.embed });
      } catch (e: any) {
        next.push({ name: file.name, id: '', embed: '', error: e?.message || 'failed' });
      }
    }
    setRows(next);
    const first = next.find((r) => r.embed);
    if (first) {
      try { await navigator.clipboard.writeText(first.embed); } catch {}
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">dispatch</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">send a pile of locals, one card each.</h1>
          <p className="text-neutral-400 text-sm mb-6">every file is published to the share db on its own id so discord can unfurl /s independently.</p>
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'dispatching…' : 'drop several files'}</p>
            <p className="text-xs text-neutral-500 mt-2">no file limit. just a slowness ping if the batch is huge.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {rows.length > 0 && (
            <ul className="mt-6 space-y-3">
              {rows.map((row) => (
                <li key={row.id || row.name} className="rounded-2xl bg-black/25 border border-white/8 p-4">
                  <p className="text-sm text-white">{row.name}</p>
                  {row.error ? (
                    <p className="text-xs text-red-400 mt-1">{row.error}</p>
                  ) : (
                    <p className="text-xs text-neutral-500 mt-1 break-all">{row.embed}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </div>
    </div>
  );
}
