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

export default function RelayPage() {
  const [hours, setHours] = useState(6);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');
  const [embed, setEmbed] = useState('');
  const [until, setUntil] = useState('');

  const send = async (file?: File) => {
    if (!file) return;
    setErr('');
    setWarn(file.size > 40 * 1024 * 1024 ? 'large handoff. encoding may feel slow. no cap.' : '');
    setBusy(true);
    try {
      const dataUrl = await readAsDataUrl(file);
      const expiresAt = new Date(Date.now() + hours * 3600 * 1000).toISOString();
      const res = await publishShare({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
        expiresAt,
      });
      if (!res.ok) throw new Error(res.error || 'relay failed');
      setEmbed(shareUrls(res.id || '').embed);
      setUntil(new Date(expiresAt).toLocaleString());
    } catch (e: any) {
      setErr(e?.message || 'relay failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">relay</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">hand a file across, then let it go cold.</h1>
          <p className="text-neutral-400 text-sm mb-6">local file into the share db with an expiry. discord still gets a /s card until the clock runs out.</p>
          <div className="flex items-center gap-3 mb-5">
            <label className="text-sm text-neutral-400">hours live</label>
            <input type="range" min={1} max={72} value={hours} onChange={(e) => setHours(Number(e.target.value))} className="flex-1" />
            <span className="text-sm text-white w-8 text-right">{hours}</span>
          </div>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); send(e.dataTransfer.files?.[0]); }}>
            <input type="file" className="hidden" onChange={(e) => send(e.target.files?.[0])} />
            <p className="text-white font-medium">{busy ? 'passing the baton…' : 'drop the handoff'}</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {embed && (
            <div className="mt-5">
              <p className="text-xs text-neutral-400 break-all">discord: {embed}</p>
              <p className="text-xs text-neutral-500 mt-1">cold after {until}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
