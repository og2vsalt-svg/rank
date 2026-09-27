import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(1) + ' mb';
}

export default function SpindlePage() {
  const [parts, setParts] = useState(4);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [rows, setRows] = useState<{ name: string; embed: string }[]>([]);

  const run = async (file?: File) => {
    if (!file) return;
    const n = Math.max(2, Math.min(12, Number(parts) || 4));
    setWarn(file.size > 40 * 1024 * 1024 ? 'chunky file. encoding each slice can feel slow. no cap.' : '');
    setErr('');
    setRows([]);
    setBusy(true);
    try {
      const buf = await file.arrayBuffer();
      const bytes = new Uint8Array(buf);
      const slice = Math.ceil(bytes.length / n);
      const out: { name: string; embed: string }[] = [];
      for (let i = 0; i < n; i++) {
        const chunk = bytes.slice(i * slice, (i + 1) * slice);
        if (!chunk.length) continue;
        const part = new File([chunk], `${file.name}.part${i + 1}`, { type: 'application/octet-stream' });
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(String(r.result || ''));
          r.onerror = () => reject(new Error('read failed'));
          r.readAsDataURL(part);
        });
        const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8) + i;
        const pub = await publishShare({ id, name: part.name, type: part.type, size: part.size, dataUrl });
        if (!pub.ok) throw new Error(pub.error || 'part failed');
        out.push({ name: part.name, embed: shareUrls(pub.id || id).embed });
      }
      setRows(out);
    } catch (e: any) {
      setErr(e?.message || 'spindle failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">spindle</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">split a local file, share each slice.</h1>
          <p className="text-neutral-400 text-sm mb-6">not a vault. one file becomes numbered parts on the share db, each with its own /s card.</p>
          <label className="text-xs text-neutral-500 block mb-2">parts (2–12)</label>
          <input type="number" min={2} max={12} value={parts} onChange={(e) => setParts(Number(e.target.value))} className="w-28 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm mb-4 outline-none" />
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition">
            <input type="file" className="hidden" onChange={(e) => run(e.target.files?.[0])} />
            <p className="text-white font-medium">{busy ? 'spinning…' : 'drop one file'}</p>
            <p className="text-xs text-neutral-500 mt-2">no hard limit. just a slowness warning.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {rows.length > 0 && (
            <ul className="mt-6 space-y-2">
              {rows.map((r) => (
                <li key={r.embed} className="text-xs text-neutral-400 break-all">{r.name} · {r.embed}</li>
              ))}
            </ul>
          )}
        </motion.div>
      </div>
    </div>
  );
}
