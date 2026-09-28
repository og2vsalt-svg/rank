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

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

type Row = { name: string; size: number; embed: string; app: string };

export default function QuayPage() {
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [rows, setRows] = useState<Row[]>([]);

  const send = async (list: FileList | File[] | null) => {
    const files = Array.from(list || []);
    if (!files.length) return;
    setErr('');
    setWarn(files.some((f) => f.size > 40 * 1024 * 1024) ? 'no cap. a few of these may make the tab feel sleepy while encoding.' : '');
    setBusy(true);
    const next: Row[] = [];
    try {
      for (const file of files) {
        const dataUrl = await readAsDataUrl(file);
        const id = uid();
        const res = await publishShare({
          id,
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl,
        });
        if (!res.ok) throw new Error(res.error || 'quay failed');
        const urls = shareUrls(res.id || id);
        next.push({ name: file.name, size: file.size, embed: urls.embed, app: urls.app });
      }
      setRows((prev) => [...next, ...prev]);
    } catch (e: any) {
      setErr(e?.message || 'quay failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">quay</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a line of files, one public card each.</h1>
          <p className="text-neutral-400 text-sm mb-6">not a vault. pick several locals. each one ships to the share db in order with its own discord /s link.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); send(e.dataTransfer.files); }}>
            <input type="file" multiple className="hidden" onChange={(e) => send(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'tying off…' : 'drop a small queue'}</p>
            <p className="text-xs text-neutral-500 mt-2">no hard limit. we only warn when it might feel slow.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          <div className="mt-6 space-y-3">
            {rows.map((r) => (
              <div key={r.embed} className="rounded-2xl bg-white/[0.04] border border-white/8 px-4 py-3">
                <p className="text-sm text-white">{r.name} · {pretty(r.size)}</p>
                <p className="text-[11px] text-neutral-500 break-all mt-1">{r.embed}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
