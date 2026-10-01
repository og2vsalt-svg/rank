import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function SoffitPage() {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');

  const stats = useMemo(() => {
    const t = text.trim();
    const words = t ? t.split(/\s+/).length : 0;
    return { words, chars: text.length, lines: text.split('\n').length };
  }, [text]);

  const publish = async () => {
    if (!text.trim()) return;
    setBusy(true);
    setErr('');
    try {
      const body = text;
      const dataUrl = `data:text/plain;charset=utf-8,${encodeURIComponent(body)}`;
      const size = new Blob([body]).size;
      if (size > 8 * 1024 * 1024) setWarn('long soffit. the tab may feel slow. no hard cap.');
      const id = uid();
      const res = await publishShare({
        id,
        name: 'soffit.txt',
        type: 'text/plain',
        size,
        dataUrl,
        author: 'soffit',
      });
      if (!res.ok) throw new Error(res.error || 'soffit sagged');
      const urls = shareUrls(res.id || id);
      setLink(urls.embed);
      if (res.warn) setWarn(res.warn);
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
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[28px] p-7">
          <p className="text-[#0a84ff] text-sm mb-2">soffit</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">write on the underside.</h1>
          <p className="text-neutral-400 text-sm mb-6">a ceiling of words counted in the tab, then poured into the share db as .txt. discord unfurls /s. not the vault grid.</p>
          <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="look up and write" rows={10} className="w-full mb-4 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none resize-none leading-relaxed" />
          <p className="text-xs text-neutral-500 mb-5">{stats.words} words · {stats.chars} letters · {stats.lines} lines</p>
          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}
          <button onClick={publish} disabled={busy || !text.trim()} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">
            {busy ? 'fixing the ceiling…' : 'hang the note'}
          </button>
          {link && <p className="text-xs text-neutral-500 mt-4 break-all">discord embed copied: {link}</p>}
        </motion.div>
      </div>
    </div>
  );
}
