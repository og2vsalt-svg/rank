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

export default function TowpathPage() {
  const [step, setStep] = useState('idle');
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');
  const [app, setApp] = useState('');
  const [label, setLabel] = useState('');

  const walk = async (list: FileList | null) => {
    const file = list?.[0];
    if (!file) return;
    setErr('');
    setEmbed('');
    setApp('');
    setLabel(`${file.name} · ${pretty(file.size)}`);
    setWarn(file.size > 10 * 1024 * 1024 ? 'long tow. encoding may hitch. no hard cap.' : '');
    setStep('reading');
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ''));
        r.onerror = () => reject(new Error('could not read file'));
        r.readAsDataURL(file);
      });
      setStep('publishing');
      const id = uid();
      const res = await publishShare({
        id,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
        author: 'towpath',
      });
      if (!res.ok) throw new Error(res.error || 'tow failed');
      if (res.warn) setWarn(res.warn);
      const urls = shareUrls(res.id || id);
      setEmbed(urls.embed);
      setApp(urls.app);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
      setStep('docked');
    } catch (e: any) {
      setErr(e?.message || 'tow failed');
      setStep('idle');
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
          <p className="text-[#0a84ff] text-sm mb-2">towpath</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">walk one local file into the share db.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            reading and publishing stay visible so you can see the haul. discord unfurls the embed link.
          </p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition">
            <input type="file" className="hidden" onChange={(e) => walk(e.target.files)} />
            <p className="text-white font-medium">
              {step === 'reading' ? 'reading…' : step === 'publishing' ? 'publishing…' : 'start the tow'}
            </p>
            <p className="text-xs text-neutral-500 mt-2">no file limit. just a slowness ping if it is huge.</p>
          </label>
          {label && <p className="text-sm text-neutral-300 mt-4">{label}</p>}
          {warn && <p className="text-amber-300/90 text-xs mt-3">{warn}</p>}
          {err && <p className="text-red-400 text-xs mt-3">{err}</p>}
          {embed && (
            <div className="mt-6 space-y-2 text-xs text-neutral-400 break-all">
              <p>app: {app}</p>
              <p>discord embed (copied): {embed}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
