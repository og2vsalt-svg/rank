import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(1) + ' mb';
}

export default function MerePage() {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [warn, setWarn] = useState('');

  const bytes = useMemo(() => new TextEncoder().encode(text).length, [text]);

  const pour = async () => {
    if (!text.trim()) return;
    setBusy(true);
    setErr('');
    if (bytes > 8 * 1024 * 1024) setWarn('deep mere. the tab may feel slow while it writes. no cap.');
    try {
      const blob = new Blob([text], { type: 'text/plain' });
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ''));
        r.onerror = () => reject(new Error('read failed'));
        r.readAsDataURL(blob);
      });
      const id = uid();
      const res = await publishShare({
        id,
        name: 'mere.txt',
        type: 'text/plain',
        size: bytes,
        dataUrl,
        author: 'mere',
      });
      if (!res.ok) throw new Error(res.error || 'the mere froze');
      const urls = shareUrls(res.id || id);
      setLink(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'failed');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[28px] p-7">
          <p className="text-[#0a84ff] text-sm mb-2">mere</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a still pool of words.</h1>
          <p className="text-neutral-400 text-sm mb-6">write a note here. we pour it into the public share table as a plain text drop with a discord card. not a vault — just water that anyone can look into.</p>
          <textarea
            value={text}
            onChange={(e) => { setText(e.target.value); setLink(''); }}
            rows={10}
            placeholder="what sits on the surface…"
            className="w-full mb-4 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#0a84ff]/40 transition-colors resize-y min-h-[180px]"
          />
          <p className="text-xs text-neutral-500 mb-4">{pretty(bytes)}</p>
          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}
          <button onClick={pour} disabled={busy || !text.trim()} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40 transition-transform active:scale-[0.98]">
            {busy ? 'settling…' : 'pour into the db'}
          </button>
          {link && <p className="text-xs text-neutral-500 mt-4 break-all">discord embed copied: {link}</p>}
        </motion.div>
      </div>
    </div>
  );
}
