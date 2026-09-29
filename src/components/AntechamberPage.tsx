import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

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

type Row = { name: string; size: number; embed?: string; error?: string; warn?: string };

export default function AntechamberPage() {
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [rows, setRows] = useState<Row[]>([]);

  const send = async (list: FileList | File[] | null) => {
    if (!list || !list.length) return;
    const files = Array.from(list as FileList);
    const total = files.reduce((n, f) => n + f.size, 0);
    setWarn(
      total > 40 * 1024 * 1024 || files.length > 6
        ? 'no cap. a pile this size can make the tab feel sleepy while it encodes.'
        : '',
    );
    setBusy(true);
    const next: Row[] = [];
    for (const file of files) {
      try {
        const dataUrl = await readAsDataUrl(file);
        const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        const res = await publishShare({
          id,
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl,
        });
        if (!res.ok) {
          next.push({ name: file.name, size: file.size, error: res.error || 'failed' });
        } else {
          const urls = shareUrls(res.id || id);
          next.push({ name: file.name, size: file.size, embed: urls.embed, warn: res.warn });
          try {
            await navigator.clipboard.writeText(urls.embed);
          } catch {}
        }
      } catch (e: any) {
        next.push({ name: file.name, size: file.size, error: e?.message || 'failed' });
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
          <p className="text-[#0a84ff] text-sm mb-2">antechamber</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a waiting room for a pile.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            drop several local files. each one walks through to the share db with its own discord /s card. skips the vault.
          </p>
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              send(e.dataTransfer.files);
            }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => send(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'ushering…' : 'drop a pile'}</p>
            <p className="text-xs text-neutral-500 mt-2">no hard limit. we only warn when it might feel slow.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {rows.length > 0 && (
            <ul className="mt-6 space-y-3">
              {rows.map((row, i) => (
                <li key={i} className="rounded-2xl bg-black/25 border border-white/8 px-4 py-3">
                  <p className="text-sm text-white">
                    {row.name} · {pretty(row.size)}
                  </p>
                  {row.embed && <p className="text-xs text-neutral-500 break-all mt-1">{row.embed}</p>}
                  {row.warn && <p className="text-xs text-amber-300/80 mt-1">{row.warn}</p>}
                  {row.error && <p className="text-xs text-red-400 mt-1">{row.error}</p>}
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </div>
    </div>
  );
}
