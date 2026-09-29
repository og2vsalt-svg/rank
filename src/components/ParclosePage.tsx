import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function ParclosePage() {
  const [text, setText] = useState('');
  const [chunk, setChunk] = useState(400);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [links, setLinks] = useState<string[]>([]);

  const parts = () => {
    const raw = text.trim();
    if (!raw) return [];
    const size = Math.max(40, chunk);
    const out: string[] = [];
    for (let i = 0; i < raw.length; i += size) out.push(raw.slice(i, i + size));
    return out;
  };

  const publish = async () => {
    const slices = parts();
    if (!slices.length) return;
    setBusy(true);
    setErr('');
    setLinks([]);
    try {
      const made: string[] = [];
      for (let i = 0; i < slices.length; i++) {
        const body = slices[i];
        const dataUrl = `data:text/plain;base64,${btoa(unescape(encodeURIComponent(body)))}`;
        const pub = await publishShare({
          id: uid(),
          name: `parclose-${i + 1}.txt`,
          type: 'text/plain',
          size: body.length,
          dataUrl,
        });
        if (!pub.ok) {
          setErr(pub.error || 'stopped mid-screen');
          break;
        }
        made.push(shareUrls(pub.id || '').embed);
      }
      setLinks(made);
      if (made[0]) {
        try { await navigator.clipboard.writeText(made.join('\n')); } catch {}
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">parclose</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">screen a long note into short drops.</h1>
          <p className="text-neutral-400 text-sm mb-6">each slice becomes its own public file and discord /s card. no vault grid.</p>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={8} className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none mb-4 resize-none" placeholder="paste a long note" />
          <div className="flex items-center gap-3 mb-5">
            <label className="text-xs text-neutral-500">slice</label>
            <input type="number" min={40} value={chunk} onChange={(e) => setChunk(Number(e.target.value) || 400)} className="w-24 px-3 py-2 rounded-full bg-white/5 border border-white/10 text-sm outline-none" />
            <span className="text-xs text-neutral-500">{parts().length} screens</span>
          </div>
          <button onClick={publish} disabled={busy || !text.trim()} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">{busy ? 'screening\u2026' : 'publish slices'}</button>
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {links.length > 0 && (
            <ul className="mt-5 space-y-1 text-xs text-neutral-500 break-all">
              {links.map((l) => <li key={l}>{l}</li>)}
            </ul>
          )}
        </motion.div>
      </div>
    </div>
  );
}
