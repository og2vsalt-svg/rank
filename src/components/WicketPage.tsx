import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

const WORDS = ['ash', 'brook', 'cedar', 'dusk', 'ember', 'flint', 'gale', 'haven', 'iris', 'jade', 'keel', 'lark', 'mist', 'nook', 'opal', 'pine', 'quill', 'reed', 'silt', 'tide'];

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function phrase() {
  const pick = () => WORDS[Math.floor(Math.random() * WORDS.length)];
  return `${pick()}-${pick()}-${Math.floor(10 + Math.random() * 89)}`;
}

export default function WicketPage() {
  const gate = useMemo(() => phrase(), []);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');

  const pour = async () => {
    if (!note.trim()) return;
    setBusy(true);
    setErr('');
    try {
      const blob = new Blob([note], { type: 'text/plain' });
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ''));
        r.onerror = () => reject(new Error('read failed'));
        r.readAsDataURL(blob);
      });
      const id = uid();
      const res = await publishShare({
        id,
        name: 'wicket.txt',
        type: 'text/plain',
        size: blob.size,
        dataUrl,
        lockPass: gate,
        author: 'wicket',
      });
      if (!res.ok) throw new Error(res.error || 'the gate stuck');
      const urls = shareUrls(res.id || id);
      setLink(urls.embed);
      try { await navigator.clipboard.writeText(`${urls.embed}  gate: ${gate}`); } catch {}
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
          <p className="text-[#0a84ff] text-sm mb-2">wicket</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a small gate for a note.</h1>
          <p className="text-neutral-400 text-sm mb-6">write something short. we hang it on the public table with a spoken phrase as the lock. discord still cards the /s link. not the vault.</p>
          <p className="text-xs text-neutral-500 mb-2">gate phrase</p>
          <p className="font-mono text-sm text-white mb-5 px-3 py-2 rounded-xl bg-white/5 border border-white/10">{gate}</p>
          <textarea
            value={note}
            onChange={(e) => { setNote(e.target.value); setLink(''); }}
            rows={7}
            placeholder="what sits behind the wicket…"
            className="w-full mb-4 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#0a84ff]/40 transition-colors resize-y min-h-[140px]"
          />
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}
          <button onClick={pour} disabled={busy || !note.trim()} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40 transition-transform active:scale-[0.98]">
            {busy ? 'latching…' : 'hang behind the gate'}
          </button>
          {link && <p className="text-xs text-neutral-500 mt-4 break-all">discord embed + gate copied: {link}</p>}
        </motion.div>
      </div>
    </div>
  );
}
