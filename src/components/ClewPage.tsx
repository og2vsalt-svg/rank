import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function ClewPage() {
  const [lines, setLines] = useState(['', '', '']);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');

  const setLine = (i: number, v: string) => {
    setLines((prev) => prev.map((x, idx) => (idx === i ? v : x)));
  };

  const wind = async () => {
    const body = lines.map((l, i) => `${i + 1}. ${l.trim()}`).filter((l) => !/^\d+\.\s*$/.test(l)).join('\n');
    if (!body.trim()) { setErr('wind at least one thread'); return; }
    setErr('');
    setBusy(true);
    try {
      const dataUrl = `data:text/plain;base64,${btoa(unescape(encodeURIComponent(body)))}`;
      const id = uid();
      const res = await publishShare({
        id,
        name: 'clew.txt',
        type: 'text/plain',
        size: new Blob([body]).size,
        dataUrl,
        author: 'clew',
      });
      if (!res.ok) throw new Error(res.error || 'clew slipped');
      const urls = shareUrls(res.id || id);
      setEmbed(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'clew slipped');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">clew</p>
          <h1 className="text-3xl font-semibold mb-3 tracking-tight">wind a few notes into one thread.</h1>
          <p className="text-neutral-400 text-sm mb-6">not a file vault. three short lines become a single public drop with a discord /s card.</p>
          <div className="space-y-3">
            {lines.map((l, i) => (
              <input
                key={i}
                value={l}
                onChange={(e) => setLine(i, e.target.value)}
                placeholder={`thread ${i + 1}`}
                className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-[#0a84ff]/50 transition"
              />
            ))}
          </div>
          <button
            onClick={() => void wind()}
            disabled={busy}
            className="mt-5 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-200 disabled:opacity-50 transition"
          >
            {busy ? 'winding…' : 'publish thread'}
          </button>
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {embed && <p className="text-xs text-neutral-400 mt-4 break-all">discord card copied · {embed}</p>}
        </motion.div>
      </div>
    </div>
  );
}
