import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('could not climb the file'));
    r.readAsDataURL(file);
  });
}

export default function RatlinePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [links, setLinks] = useState<string[]>([]);

  const pick = (list: FileList | null) => {
    const next = list ? Array.from(list) : [];
    setFiles(next);
    setLinks([]);
    setErr('');
    const heavy = next.some((f) => f.size > 16 * 1024 * 1024);
    setWarn(heavy ? 'tall rig. large files may stall the tab while they climb. no hard cap.' : '');
  };

  const climb = async () => {
    if (!files.length) return;
    setBusy(true);
    setErr('');
    const out: string[] = [];
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
          author: 'ratline',
        });
        if (!res.ok) throw new Error(res.error || `missed ${file.name}`);
        const urls = shareUrls(res.id || id);
        out.push(urls.embed);
        if (res.warn) setWarn(res.warn);
      }
      setLinks(out);
      try { await navigator.clipboard.writeText(out.join('\n')); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'failed');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[28px] p-7"
        >
          <p className="text-[#0a84ff] text-sm mb-2">ratline</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">climb a handful of local files.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            pick several files at once. each one is written into the share database with its own discord card. not a vault folder.
          </p>
          <label
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              pick(e.dataTransfer.files);
            }}
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center mb-5 transition-all duration-300"
          >
            <input type="file" multiple className="hidden" onChange={(e) => pick(e.target.files)} />
            <span className="text-sm text-neutral-300">{files.length ? `${files.length} on the shroud` : 'drop several files on the ratlines'}</span>
          </label>
          {files.length > 0 && (
            <ul className="mb-5 space-y-1">
              {files.map((f) => (
                <li key={f.name + f.size} className="text-xs text-neutral-400 flex justify-between gap-3">
                  <span className="truncate">{f.name}</span>
                  <span className="shrink-0 tabular-nums">{pretty(f.size)}</span>
                </li>
              ))}
            </ul>
          )}
          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}
          <button
            onClick={climb}
            disabled={busy || !files.length}
            className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40 transition-transform active:scale-[0.98]"
          >
            {busy ? 'climbing…' : 'send each up the shroud'}
          </button>
          {links.length > 0 && (
            <div className="mt-4 space-y-1">
              <p className="text-xs text-neutral-500">discord cards copied</p>
              {links.map((l) => (
                <p key={l} className="text-xs text-neutral-400 break-all">{l}</p>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
