import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function DewpondPage() {
  const [lines, setLines] = useState<string[]>(['']);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');

  const publish = async () => {
    const body = lines.map((l) => l.trim()).filter(Boolean).join('\n');
    if (!body) {
      setErr('add at least one line.');
      return;
    }
    setBusy(true);
    setErr('');
    const text = `# dewpond\n${new Date().toISOString()}\n\n${body}\n`;
    const dataUrl = `data:text/markdown;base64,${btoa(unescape(encodeURIComponent(text)))}`;
    const id = uid();
    const res = await publishShare({
      id,
      name: 'dewpond.md',
      type: 'text/markdown',
      size: text.length,
      dataUrl,
    });
    setBusy(false);
    if (!res.ok) {
      setErr(res.error || 'could not reach the share db');
      return;
    }
    const urls = shareUrls(res.id || id);
    setEmbed(urls.embed);
    try { await navigator.clipboard.writeText(urls.embed); } catch {}
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">dewpond</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">collect drips, then pour.</h1>
          <p className="text-neutral-400 text-sm mb-6">stack short lines in the tab. when you are ready, the whole pond ships as one markdown drop.</p>
          <div className="space-y-2 mb-4">
            {lines.map((line, i) => (
              <input
                key={i}
                value={line}
                onChange={(e) => setLines((prev) => prev.map((p, idx) => (idx === i ? e.target.value : p)))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    setLines((prev) => [...prev, '']);
                  }
                }}
                placeholder="a drip"
                className="w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none"
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setLines((p) => [...p, ''])} className="px-4 py-2 rounded-full glass text-sm">add line</button>
            <button onClick={publish} disabled={busy} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50">
              {busy ? 'pouring…' : 'publish pond'}
            </button>
          </div>
          <p className="text-xs text-neutral-500 mt-3">no file limit. just a slowness ping if the pond is huge.</p>
          {err && <p className="text-xs text-rose-300/80 mt-3">{err}</p>}
          {embed && <p className="text-xs text-[#0a84ff] break-all mt-4">{embed}</p>}
        </motion.div>
      </div>
    </div>
  );
}
