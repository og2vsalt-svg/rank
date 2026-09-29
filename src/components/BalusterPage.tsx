import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

const WORDS = ['quiet', 'cedar', 'harbor', 'lumen', 'drift', 'ember', 'folio', 'prism', 'quay', 'wick', 'hearth', 'nook', 'silt', 'loom', 'marrow', 'gable', 'jetty', 'spool', 'tinder', 'yarrow'];

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function phrase() {
  const pick = () => WORDS[Math.floor(Math.random() * WORDS.length)];
  return `${pick()}-${pick()}-${pick()}-${Math.floor(10 + Math.random() * 89)}`;
}

export default function BalusterPage() {
  const [value, setValue] = useState(phrase);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');

  const publish = async () => {
    setBusy(true);
    setErr('');
    try {
      const text = `phrase: ${value}\n\n${note}`.trim();
      const dataUrl = `data:text/plain;base64,${btoa(unescape(encodeURIComponent(text)))}`;
      const pub = await publishShare({
        id: uid(),
        name: 'baluster.txt',
        type: 'text/plain',
        size: text.length,
        dataUrl,
        lockPass: value,
      });
      if (!pub.ok) {
        setErr(pub.error || 'could not publish');
        return;
      }
      const urls = shareUrls(pub.id || '');
      setEmbed(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">baluster</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">mint a rail phrase. lock the note with it.</h1>
          <p className="text-neutral-400 text-sm mb-6">the phrase is the passcode. friends need it to open the drop. discord still unfurls /s.</p>
          <div className="flex gap-2 mb-4">
            <input value={value} onChange={(e) => setValue(e.target.value)} className="flex-1 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none font-mono" />
            <button onClick={() => setValue(phrase())} className="px-4 py-2.5 rounded-full bg-white/5 text-sm">spin</button>
          </div>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={5} placeholder="optional note behind the rail" className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none mb-4 resize-none" />
          <button onClick={publish} disabled={busy || !value} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">{busy ? 'publishing\u2026' : 'lock and publish'}</button>
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {embed && <p className="text-xs text-neutral-500 mt-4 break-all">embed copied: {embed}</p>}
        </motion.div>
      </div>
    </div>
  );
}
