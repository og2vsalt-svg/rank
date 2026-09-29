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

export default function LockgatePage() {
  const [pass, setPass] = useState('');
  const [hours, setHours] = useState('72');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');
  const [info, setInfo] = useState('');

  const send = async (list: FileList | null) => {
    const file = list?.[0];
    if (!file) return;
    setErr('');
    setEmbed('');
    setInfo(`${file.name} \u00b7 ${pretty(file.size)}`);
    setWarn(file.size > 12 * 1024 * 1024 ? 'heavy lock. encoding may feel slow. no hard cap.' : '');
    setBusy(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ''));
        r.onerror = () => reject(new Error('could not read file'));
        r.readAsDataURL(file);
      });
      const hrs = Math.max(0, Number(hours) || 0);
      const expiresAt = hrs > 0 ? new Date(Date.now() + hrs * 3600 * 1000).toISOString() : null;
      const id = uid();
      const res = await publishShare({
        id,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
        lockPass: pass || undefined,
        expiresAt,
        author: 'lockgate',
      });
      if (!res.ok) throw new Error(res.error || 'gate failed');
      if (res.warn) setWarn(res.warn);
      const urls = shareUrls(res.id || id);
      setEmbed(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'lockgate failed');
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
          <p className="text-[#0a84ff] text-sm mb-2">lockgate</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">publish with an optional pass and tide.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            still no size cap. set a passcode and how many hours the drop should live. discord unfurls /s.
          </p>
          <div className="grid grid-cols-2 gap-3 mb-5">
            <input value={pass} onChange={(e) => setPass(e.target.value)} placeholder="optional pass" className="px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none" />
            <input value={hours} onChange={(e) => setHours(e.target.value)} placeholder="hours (0 = keep)" className="px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none" />
          </div>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition">
            <input type="file" className="hidden" onChange={(e) => send(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'closing the gate…' : 'choose a local file'}</p>
            <p className="text-xs text-neutral-500 mt-2">no file limit. just a slowness ping if it is huge.</p>
          </label>
          {info && <p className="text-sm text-neutral-300 mt-4">{info}</p>}
          {warn && <p className="text-amber-300/90 text-xs mt-3">{warn}</p>}
          {err && <p className="text-red-400 text-xs mt-3">{err}</p>}
          {embed && <p className="text-xs text-neutral-400 mt-4 break-all">discord embed (copied): {embed}</p>}
        </motion.div>
      </div>
    </div>
  );
}
