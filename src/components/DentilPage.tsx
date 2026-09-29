import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('could not read file'));
    r.readAsDataURL(file);
  });
}

export default function DentilPage() {
  const [hours, setHours] = useState(24);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');
  const [until, setUntil] = useState('');

  const onFile = async (list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    setErr('');
    setEmbed('');
    setWarn(f.size > 12 * 1024 * 1024 ? 'large drop. encoding may feel slow. no hard cap.' : '');
    setBusy(true);
    try {
      const dataUrl = await readAsDataUrl(f);
      const expiresAt = new Date(Date.now() + Math.max(1, hours) * 3600 * 1000).toISOString();
      const pub = await publishShare({
        id: uid(),
        name: f.name,
        type: f.type || 'application/octet-stream',
        size: f.size,
        dataUrl,
        expiresAt,
      });
      if (!pub.ok) {
        setErr(pub.error || 'could not publish');
        return;
      }
      if (pub.warn) setWarn(pub.warn);
      setUntil(expiresAt);
      const urls = shareUrls(pub.id || '');
      setEmbed(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'dentil failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">dentil</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a short tooth of time on a public drop.</h1>
          <p className="text-neutral-400 text-sm mb-6">set how many hours the share stays live. after that the db treats it as gone. discord still unfurls /s while it lasts.</p>
          <div className="flex items-center gap-3 mb-5">
            <label className="text-xs text-neutral-500">hours</label>
            <input type="number" min={1} max={720} value={hours} onChange={(e) => setHours(Number(e.target.value) || 24)} className="w-24 px-3 py-2 rounded-full bg-white/5 border border-white/10 text-sm outline-none" />
          </div>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-8 text-center">
            <input type="file" className="hidden" onChange={(e) => onFile(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'publishing\u2026' : 'drop a local file'}</p>
            <p className="text-xs text-neutral-500 mt-2">no size cap. only a slowness warning.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {until && <p className="text-xs text-neutral-500 mt-4">expires {new Date(until).toLocaleString()}</p>}
          {embed && <p className="text-xs text-neutral-500 mt-1 break-all">discord card: {embed}</p>}
        </motion.div>
      </div>
    </div>
  );
}
