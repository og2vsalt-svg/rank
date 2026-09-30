import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function pretty(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

export default function ParcelPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');

  const total = files.reduce((s, f) => s + f.size, 0);

  const add = (list: FileList | File[]) => {
    const next = [...files, ...Array.from(list)];
    setFiles(next);
    setWarn(next.reduce((s, f) => s + f.size, 0) > 40 * 1024 * 1024 ? 'no cap. this pile may make the tab feel slow.' : '');
  };

  const ship = async () => {
    if (!files.length) return;
    setBusy(true);
    setErr('');
    setEmbed('');
    try {
      const lines = files.map((f) => `${f.name}\t${f.type || 'application/octet-stream'}\t${f.size}\t${pretty(f.size)}`);
      const body = ['rankvault parcel', new Date().toISOString(), '', ...lines, '', `files: ${files.length}`, `bytes: ${total}`].join('\n');
      const file = new File([body], 'parcel.txt', { type: 'text/plain' });
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ''));
        r.onerror = () => reject(new Error('read failed'));
        r.readAsDataURL(file);
      });
      const id = uid();
      const res = await publishShare({
        id,
        name: file.name,
        type: 'text/plain',
        size: file.size,
        dataUrl,
        author: 'parcel',
      });
      if (!res.ok) throw new Error(res.error || 'parcel failed');
      const urls = shareUrls(res.id || id);
      setEmbed(urls.embed);
      try {
        await navigator.clipboard.writeText(urls.embed);
      } catch {}
    } catch (e: any) {
      setErr(e?.message || 'parcel failed');
    } finally {
      setBusy(false);
    }
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
          <p className="text-[#0a84ff] text-sm mb-2">parcel</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">tie a packing list, not a vault shelf.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            names and sizes stay local until you ship a .txt manifesto to the share db. discord unfurls the /s card.
          </p>
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-8 text-center mb-5"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files?.length) add(e.dataTransfer.files);
            }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => e.target.files && add(e.target.files)} />
            <p className="text-white font-medium">add locals to the parcel</p>
          </label>
          {files.length > 0 && (
            <ul className="space-y-1.5 mb-5 max-h-48 overflow-auto text-sm text-neutral-400">
              {files.map((f, i) => (
                <li key={i} className="flex justify-between gap-3">
                  <span className="truncate">{f.name}</span>
                  <span className="shrink-0 text-neutral-500">{pretty(f.size)}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-neutral-500 mb-4">{files.length} items · {pretty(total)}</p>
          <button
            disabled={busy || !files.length}
            onClick={ship}
            className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40"
          >
            {busy ? 'tying the string…' : 'ship the packing list'}
          </button>
          {warn && <p className="text-xs text-amber-300/90 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {embed && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5 text-xs text-neutral-400 break-all">
              discord (copied): {embed}
            </motion.p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
