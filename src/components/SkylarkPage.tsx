import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function SkylarkPage() {
  const [bars, setBars] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');

  const glow = useMemo(() => bars.slice(0, 48), [bars]);

  const onFile = async (file?: File) => {
    if (!file) return;
    setErr('');
    setEmbed('');
    setWarn(file.size > 40 * 1024 * 1024 ? 'big bird. tab might lag while it sings. no file cap.' : '');
    const buf = await file.slice(0, 4096).arrayBuffer();
    const bytes = new Uint8Array(buf);
    const next: number[] = [];
    for (let i = 0; i < bytes.length; i += 8) {
      let acc = 0;
      for (let j = 0; j < 8 && i + j < bytes.length; j++) acc += bytes[i + j];
      next.push(acc / (8 * 255));
    }
    setBars(next);
    setBusy(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ''));
        r.onerror = () => reject(new Error('read fail'));
        r.readAsDataURL(file);
      });
      const id = uid();
      const res = await publishShare({
        id,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
        author: 'skylark',
      });
      if (!res.ok) {
        setErr(res.error || 'could not land in db');
        return;
      }
      if (res.warn) setWarn(res.warn);
      setEmbed(shareUrls(id).embed);
      try { await navigator.clipboard.writeText(shareUrls(id).embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 24 }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">skylark</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">listen to the first bytes, then publish.</h1>
          <p className="text-neutral-400 text-sm mb-6">waveform from the header only. the whole file still goes to the share table.</p>
          <div className="h-20 flex items-end gap-[3px] mb-6">
            {(glow.length ? glow : Array.from({ length: 48 }, () => 0.12)).map((v, i) => (
              <motion.span
                key={i}
                className="flex-1 rounded-full bg-[#0a84ff]"
                animate={{ height: `${Math.max(8, v * 80)}%`, opacity: 0.35 + v * 0.65 }}
                transition={{ type: 'spring', stiffness: 180, damping: 18 }}
              />
            ))}
          </div>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-8 text-center">
            <input type="file" className="hidden" onChange={(e) => onFile(e.target.files?.[0] || undefined)} />
            <p className="text-white font-medium">{busy ? 'lifting…' : 'pick a file'}</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {embed && <p className="text-xs text-neutral-400 mt-4 break-all">discord card: {embed}</p>}
        </motion.div>
      </div>
    </div>
  );
}
