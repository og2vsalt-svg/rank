import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(1) + ' mb';
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('read failed'));
    r.readAsDataURL(file);
  });
}

type Slip = { file: File; embed?: string; app?: string; err?: string };

export default function HarborPage() {
  const [slips, setSlips] = useState<Slip[]>([]);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');

  const dock = (list: FileList | null) => {
    if (!list?.length) return;
    const next = Array.from(list).map((file) => ({ file }));
    setSlips((prev) => [...prev, ...next]);
    const total = [...slips, ...next].reduce((s, x) => s + x.file.size, 0);
    setWarn(total > 8 * 1024 * 1024 ? 'busy harbor. large piles may feel slow. no hard cap.' : '');
  };

  const launch = async () => {
    if (!slips.length) return;
    setBusy(true);
    const out: Slip[] = [];
    for (const slip of slips) {
      try {
        const dataUrl = await readAsDataUrl(slip.file);
        const id = uid();
        const res = await publishShare({
          id,
          name: slip.file.name,
          type: slip.file.type || 'application/octet-stream',
          size: slip.file.size,
          dataUrl,
          author: 'harbor',
        });
        if (!res.ok) throw new Error(res.error || 'harbor failed');
        const urls = shareUrls(res.id || id);
        out.push({ ...slip, embed: urls.embed, app: urls.app, err: undefined });
        if (res.warn) setWarn(res.warn);
      } catch (e: any) {
        out.push({ ...slip, err: e?.message || 'failed' });
      }
    }
    setSlips(out);
    const first = out.find((s) => s.embed)?.embed;
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
          <p className="text-[#0a84ff] text-sm mb-2">harbor</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">tie locals to the dock, then send each out.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            not a vault. queue a pile, publish each file to the share db with its own discord /s card.
          </p>
          <label className="block rounded-2xl border border-dashed border-white/15 bg-black/20 px-5 py-8 text-center cursor-pointer hover:border-[#0a84ff]/40 transition">
            <input type="file" multiple className="hidden" onChange={(e) => dock(e.target.files)} />
            <span className="text-sm text-neutral-300">bring files into harbor</span>
          </label>
          {slips.length > 0 && (
            <ul className="mt-5 space-y-2">
              {slips.map((s, i) => (
                <li key={i} className="rounded-2xl bg-black/20 border border-white/5 px-4 py-3">
                  <div className="flex justify-between gap-3 text-sm text-neutral-300">
                    <span className="truncate">{s.file.name}</span>
                    <span className="text-xs text-neutral-500">{pretty(s.file.size)}</span>
                  </div>
                  {s.embed && <p className="text-xs text-neutral-500 mt-1 break-all">{s.embed}</p>}
                  {s.err && <p className="text-xs text-red-400 mt-1">{s.err}</p>}
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap gap-2 mt-5">
            <button onClick={() => setSlips([])} className="px-4 py-2 rounded-full glass text-sm text-neutral-300">clear dock</button>
            <button onClick={launch} disabled={busy || !slips.length} className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium">
              {busy ? 'casting off…' : 'publish each'}
            </button>
          </div>
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
        </motion.div>
      </div>
    </div>
  );
}
