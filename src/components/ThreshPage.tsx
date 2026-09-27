import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(1) + ' mb';
}

export default function ThreshPage() {
  const [minMb, setMinMb] = useState(0);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [kept, setKept] = useState<{ name: string; size: number; embed: string }[]>([]);

  const run = async (list: FileList | null) => {
    if (!list?.length) return;
    const floor = Math.max(0, minMb) * 1024 * 1024;
    const files = [...list].filter((f) => f.size >= floor);
    setWarn(files.some((f) => f.size > 40 * 1024 * 1024) ? 'at least one file is huge. publishing may feel slow. no cap.' : '');
    setErr('');
    setKept([]);
    if (!files.length) {
      setErr('nothing passed the size floor');
      return;
    }
    setBusy(true);
    try {
      const out: { name: string; size: number; embed: string }[] = [];
      for (const file of files) {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(String(r.result || ''));
          r.onerror = () => reject(new Error('read failed'));
          r.readAsDataURL(file);
        });
        const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        const pub = await publishShare({
          id,
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl,
        });
        if (!pub.ok) throw new Error(pub.error || 'publish failed');
        out.push({ name: file.name, size: file.size, embed: shareUrls(pub.id || id).embed });
      }
      setKept(out);
    } catch (e: any) {
      setErr(e?.message || 'thresh failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">thresh</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">keep files over a size floor, then share them.</h1>
          <p className="text-neutral-400 text-sm mb-6">not a vault grid. you pick a minimum mb, we publish only the ones that pass. discord still uses /s.</p>
          <label className="text-xs text-neutral-500 block mb-2">min mb (0 = keep all)</label>
          <input type="number" min={0} value={minMb} onChange={(e) => setMinMb(Number(e.target.value))} className="w-28 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm mb-4 outline-none" />
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition">
            <input type="file" multiple className="hidden" onChange={(e) => run(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'threshing…' : 'drop a pile'}</p>
            <p className="text-xs text-neutral-500 mt-2">no hard limit. we only warn when it might lag.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {kept.length > 0 && (
            <ul className="mt-6 space-y-2">
              {kept.map((k) => (
                <li key={k.embed} className="text-xs text-neutral-400 break-all">{k.name} · {pretty(k.size)} · {k.embed}</li>
              ))}
            </ul>
          )}
        </motion.div>
      </div>
    </div>
  );
}
