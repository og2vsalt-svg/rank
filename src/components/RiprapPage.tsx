import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function stones(text: string) {
  return text
    .split(/\n+|(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function RiprapPage() {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [warn, setWarn] = useState('');
  const chunks = useMemo(() => stones(text), [text]);

  const pour = async () => {
    if (!chunks.length) return;
    setBusy(true);
    setErr('');
    const md = chunks.map((s, i) => `${i + 1}. ${s}`).join('\n\n');
    if (md.length > 8 * 1024 * 1024) setWarn('a long bank. the tab may feel slow. no cap.');
    try {
      const blob = new Blob([md], { type: 'text/markdown' });
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ''));
        r.onerror = () => reject(new Error('read failed'));
        r.readAsDataURL(blob);
      });
      const id = uid();
      const res = await publishShare({
        id,
        name: 'riprap.md',
        type: 'text/markdown',
        size: blob.size,
        dataUrl,
        author: 'riprap',
      });
      if (!res.ok) throw new Error(res.error || 'the bank would not hold');
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
          <p className="text-[#0a84ff] text-sm mb-2">riprap</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">stack a bank of sentences.</h1>
          <p className="text-neutral-400 text-sm mb-6">paste a passage. we break it into numbered stones and publish a markdown drop. discord unfurls /s. not a vault drawer.</p>
          <textarea
            value={text}
            onChange={(e) => { setText(e.target.value); setLink(''); }}
            rows={9}
            placeholder="pour the river here…"
            className="w-full mb-4 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#0a84ff]/40 transition-colors resize-y min-h-[160px]"
          />
          <p className="text-xs text-neutral-500 mb-4">{chunks.length} stones</p>
          {chunks.length > 0 && (
            <ol className="mb-5 space-y-1.5 max-h-40 overflow-y-auto text-sm text-neutral-400">
              {chunks.slice(0, 12).map((s, i) => (
                <li key={i} className="truncate">{s}</li>
              ))}
            </ol>
          )}
          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}
          <button onClick={pour} disabled={busy || !chunks.length} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40 transition-transform active:scale-[0.98]">
            {busy ? 'stacking…' : 'lay the bank'}
          </button>
          {link && <p className="text-xs text-neutral-500 mt-4 break-all">discord embed copied: {link}</p>}
        </motion.div>
      </div>
    </div>
  );
}
