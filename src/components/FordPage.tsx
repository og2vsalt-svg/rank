import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(2) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('could not read file'));
    r.readAsDataURL(file);
  });
}

export default function FordPage() {
  const [a, setA] = useState<File | null>(null);
  const [b, setB] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');

  const heavier = a && b ? (a.size >= b.size ? a : b) : null;
  const warn = heavier && heavier.size > 40 * 1024 * 1024
    ? 'the heavier file is large. publish may feel slow. no hard cap.'
    : heavier && heavier.size > 8 * 1024 * 1024
      ? 'chunky crossing. give the tab a second.'
      : undefined;

  const publish = async () => {
    if (!heavier) return;
    setBusy(true);
    setErr('');
    try {
      const dataUrl = await readAsDataUrl(heavier);
      const id = `ford-${Date.now().toString(36)}`;
      const res = await publishShare({
        id,
        name: heavier.name,
        type: heavier.type || 'application/octet-stream',
        size: heavier.size,
        dataUrl,
        author: a && b ? `ford ${pretty(a.size)} vs ${pretty(b.size)}` : 'ford',
      });
      if (!res.ok) {
        setErr(res.error || 'could not publish to the share db');
        return;
      }
      const urls = shareUrls(id);
      setEmbed(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'publish failed');
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
          <p className="text-[#0a84ff] text-sm mb-2">ford</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">two locals. ship the heavier one.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            weigh two files in the tab. only the heavier crossing goes to the share db. discord unfurls /s.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="rounded-[24px] border border-dashed border-white/15 bg-black/20 px-4 py-8 text-center cursor-pointer hover:border-[#0a84ff]/40 transition">
              <input type="file" className="hidden" onChange={(e) => { setA(e.target.files?.[0] || null); setEmbed(''); }} />
              <span className="text-sm text-neutral-300">{a ? a.name : 'bank a'}</span>
              {a && <p className="text-xs text-neutral-500 mt-2">{pretty(a.size)}</p>}
            </label>
            <label className="rounded-[24px] border border-dashed border-white/15 bg-black/20 px-4 py-8 text-center cursor-pointer hover:border-[#0a84ff]/40 transition">
              <input type="file" className="hidden" onChange={(e) => { setB(e.target.files?.[0] || null); setEmbed(''); }} />
              <span className="text-sm text-neutral-300">{b ? b.name : 'bank b'}</span>
              {b && <p className="text-xs text-neutral-500 mt-2">{pretty(b.size)}</p>}
            </label>
          </div>
          {heavier && (
            <div className="mt-6 text-sm text-neutral-300">
              <p>crossing with <span className="text-white">{heavier.name}</span> · {pretty(heavier.size)}</p>
              {warn && <p className="text-amber-400/80 text-xs mt-2">{warn}</p>}
              <button disabled={busy} onClick={publish} className="mt-4 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">
                {busy ? 'publishing…' : 'publish heavier file'}
              </button>
            </div>
          )}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {embed && <p className="mt-4 text-xs text-neutral-400 break-all">discord embed (copied): {embed}</p>}
        </motion.div>
      </div>
    </div>
  );
}
