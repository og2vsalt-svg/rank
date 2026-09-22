import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function CinderPage() {
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [hours, setHours] = useState(6);
  const [pass, setPass] = useState('');
  const [link, setLink] = useState('');

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setErr('');
    setWarn(file.size > 20 * 1024 * 1024 ? 'big ember. upload still goes, preview may lag.' : '');
    setBusy(true);
    try {
      const dataUrl = await readFile(file);
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const expiresAt = new Date(Date.now() + hours * 3600 * 1000).toISOString();
      const res = await publishShare({
        id,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
        lockPass: pass || undefined,
        expiresAt,
      });
      if (!res.ok) {
        setErr(res.error || 'could not write the ember');
        return;
      }
      if (res.warn) setWarn(res.warn);
      setLink(shareUrls(res.id || id).embed);
    } catch (e: any) {
      setErr(e?.message || 'read failed');
    } finally {
      setBusy(false);
    }
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
          <p className="text-[#0a84ff] text-sm mb-2">cinder</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a drop that goes cold.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            not a vault. timed public ember with an optional pass. after the clock, the share page just shrugs.
          </p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <label className="text-xs text-neutral-500">
              hours alive
              <input
                type="number"
                min={1}
                max={168}
                value={hours}
                onChange={(e) => setHours(Math.max(1, Number(e.target.value) || 1))}
                className="mt-1 w-full px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none text-white"
              />
            </label>
            <label className="text-xs text-neutral-500">
              optional pass
              <input
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                className="mt-1 w-full px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none text-white"
              />
            </label>
          </div>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition">
            <input type="file" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            <p className="text-white font-medium">{busy ? 'lighting…' : 'choose a local file'}</p>
            <p className="text-xs text-neutral-500 mt-2">writes to the same public share db. no size lock.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {link && (
            <div className="mt-5 rounded-2xl bg-white/[0.03] border border-white/8 p-4">
              <p className="text-[11px] text-neutral-500">discord embed</p>
              <p className="text-xs text-neutral-300 break-all mt-1">{link}</p>
              <button
                onClick={() => navigator.clipboard.writeText(link)}
                className="mt-3 px-3 py-1.5 rounded-full bg-white text-black text-xs font-medium"
              >
                copy embed
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
