import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

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

export default function MullionPage() {
  const [left, setLeft] = useState<File | null>(null);
  const [right, setRight] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<{ name: string; embed: string }[]>([]);
  const [err, setErr] = useState('');

  const pick = (side: 'l' | 'r', f?: File) => {
    if (!f) return;
    if (side === 'l') setLeft(f);
    else setRight(f);
  };

  const send = async () => {
    const files = [left, right].filter(Boolean) as File[];
    if (!files.length) return;
    setBusy(true);
    setErr('');
    const next: { name: string; embed: string }[] = [];
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
        if (!res.ok) throw new Error(res.error || 'share failed');
        next.push({ name: file.name, embed: shareUrls(res.id || id).embed });
      }
      setOut(next);
    } catch (e: any) {
      setErr(e?.message || 'mullion failed');
    } finally {
      setBusy(false);
    }
  };

  const pane = (label: string, file: File | null, side: 'l' | 'r') => (
    <label className="flex-1 rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/40 p-6 text-center cursor-pointer transition min-h-[140px]">
      <input type="file" className="hidden" onChange={(e) => pick(side, e.target.files?.[0])} />
      <p className="text-xs text-neutral-500 mb-2">{label}</p>
      <p className="text-sm text-white">{file ? file.name : 'empty pane'}</p>
      {file && file.size > 40 * 1024 * 1024 && (
        <p className="text-xs text-amber-300/80 mt-2">heavy pane. still ships, may lag.</p>
      )}
    </label>
  );

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">mullion</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">two panes, two public drops.</h1>
          <p className="text-neutral-400 text-sm mb-6">compare two local files side by side, then push both into the share db.</p>
          <div className="flex flex-col sm:flex-row gap-3">{pane('left', left, 'l')}{pane('right', right, 'r')}</div>
          <button
            disabled={busy || (!left && !right)}
            onClick={send}
            className="mt-6 w-full rounded-full bg-white text-black py-3 text-sm font-medium disabled:opacity-40 hover:bg-neutral-200 transition"
          >
            {busy ? 'framing…' : 'share both panes'}
          </button>
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          <div className="mt-4 space-y-2">
            {out.map((o) => (
              <p key={o.embed} className="text-xs text-neutral-400 break-all">{o.name} · {o.embed}</p>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
