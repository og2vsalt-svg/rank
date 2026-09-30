import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

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

type Held = { file: File; warn: string };

export default function WeirPage() {
  const [held, setHeld] = useState<Held[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [out, setOut] = useState<{ name: string; embed: string }[]>([]);

  const add = (list: FileList | null) => {
    if (!list?.length) return;
    const next: Held[] = [];
    for (const f of Array.from(list)) {
      next.push({
        file: f,
        warn: f.size > 12 * 1024 * 1024 ? 'this one may feel slow. no cap.' : '',
      });
    }
    setHeld((prev) => [...prev, ...next]);
    setErr('');
  };

  const release = async () => {
    if (!held.length || busy) return;
    setBusy(true);
    setErr('');
    const shipped: { name: string; embed: string }[] = [];
    try {
      for (const item of held) {
        const dataUrl = await readAsDataUrl(item.file);
        const id = uid();
        const pub = await publishShare({
          id,
          name: item.file.name,
          type: item.file.type || 'application/octet-stream',
          size: item.file.size,
          dataUrl,
        });
        if (!pub.ok) {
          setErr(pub.error || `could not ship ${item.file.name}`);
          break;
        }
        shipped.push({ name: item.file.name, embed: shareUrls(id).embed });
      }
      setOut(shipped);
      if (shipped.length === held.length) setHeld([]);
    } catch (e: any) {
      setErr(e?.message || 'weir failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">weir</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">hold locals behind the gate, then let them through.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            a queue, not a vault. files stay on this device until you lift the weir. each one becomes its own public drop and discord /s card.
          </p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-8 text-center transition-colors duration-300">
            <input type="file" multiple className="hidden" onChange={(e) => add(e.target.files)} />
            <p className="text-white font-medium">add files to the pool</p>
            <p className="text-xs text-neutral-500 mt-2">nothing ships until you release.</p>
          </label>
          <AnimatePresence>
            {held.map((item, i) => (
              <motion.div
                key={item.file.name + i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mt-3 rounded-2xl bg-white/[0.04] border border-white/8 px-4 py-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm text-white truncate">{item.file.name}</p>
                  <p className="text-[11px] text-neutral-500">{pretty(item.file.size)}{item.warn ? ' · ' + item.warn : ''}</p>
                </div>
                <button
                  onClick={() => setHeld((prev) => prev.filter((_, idx) => idx !== i))}
                  className="text-[12px] text-neutral-500 hover:text-white"
                >
                  lift one
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          <button
            onClick={release}
            disabled={!held.length || busy}
            className="mt-5 w-full rounded-full bg-white text-black text-sm font-medium py-2.5 disabled:opacity-40 hover:bg-neutral-200 transition-colors"
          >
            {busy ? 'opening the gate…' : 'release the weir'}
          </button>
          {err && <p className="text-red-400 text-xs mt-3">{err}</p>}
          {out.map((row) => (
            <p key={row.embed} className="text-xs text-neutral-400 mt-2 break-all">
              {row.name} · {row.embed}
            </p>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
