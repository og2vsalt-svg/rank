import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function rid() {
  return Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 6);
}

function formatBytes(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  return (n / (1024 * 1024)).toFixed(2) + ' mb';
}

export default function CourierPage() {
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [rows, setRows] = useState<{ name: string; embed: string; app: string; size: number }[]>([]);

  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    const files = [...list];
    const chunky = files.some((f) => f.size > 40 * 1024 * 1024);
    setWarn(chunky ? 'huge file. no cap, but this tab might feel sleepy while it encodes.' : '');
    setErr('');
    setBusy(true);
    const next: { name: string; embed: string; app: string; size: number }[] = [];
    try {
      for (const file of files) {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(String(r.result || ''));
          r.onerror = () => reject(new Error('read failed'));
          r.readAsDataURL(file);
        });
        const id = rid();
        const res = await publishShare({
          id,
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl,
        });
        if (!res.ok) {
          setErr(res.error || `could not publish ${file.name}`);
          continue;
        }
        if (res.warn) setWarn(res.warn);
        const urls = shareUrls(res.id || id);
        next.push({ name: file.name, embed: urls.embed, app: urls.app, size: file.size });
      }
      setRows((prev) => [...next, ...prev]);
      if (next[0]) {
        try { await navigator.clipboard.writeText(next[0].embed); } catch {}
      }
    } catch (e: any) {
      setErr(e?.message || 'courier failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">courier</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">local file, cloud link.</h1>
          <p className="text-neutral-400 text-sm mb-6">uploads straight into the public shares table. you get a /s/ url discord can unfurl. no hard size cap — just a lag warning.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition">
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <span className="text-neutral-200">{busy ? 'sending…' : 'drop files or click'}</span>
          </label>
          {warn && <p className="text-amber-300/90 text-xs mt-4">{warn}</p>}
          {err && <p className="text-rose-300 text-xs mt-4">{err}</p>}
          <div className="mt-6 space-y-3">
            {rows.map((r) => (
              <div key={r.embed} className="rounded-2xl bg-white/[0.04] border border-white/8 px-4 py-3">
                <p className="text-sm text-white truncate">{r.name}</p>
                <p className="text-[11px] text-neutral-500 mb-2">{formatBytes(r.size)}</p>
                <p className="text-[12px] text-[#0a84ff] break-all">{r.embed}</p>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => navigator.clipboard.writeText(r.embed)} className="text-[12px] px-3 py-1.5 rounded-full bg-white/8 border border-white/10">copy embed</button>
                  <a href={r.app} className="text-[12px] px-3 py-1.5 rounded-full bg-white/8 border border-white/10">open</a>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
