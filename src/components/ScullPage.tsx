import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function ScullPage() {
  const [text, setText] = useState('');
  const [name, setName] = useState('note.txt');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');

  const fromFile = async (file: File | null) => {
    if (!file) return;
    setName(file.name || 'note.txt');
    setText(await file.text());
  };

  const send = async () => {
    if (!text.trim()) return;
    setBusy(true);
    setErr('');
    const file = new File([text], name || 'note.txt', { type: 'text/plain' });
    const result = await publishLocalFile(file, { caption: text.slice(0, 140), author: 'scull' });
    setBusy(false);
    if (!result.ok || !result.id) {
      setErr(result.error || 'share row was not written');
      return;
    }
    const urls = shareUrls(result.id);
    setLink(urls.embed);
    try { await navigator.clipboard.writeText(urls.embed); } catch {}
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-24 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[28px] p-6 sm:p-8">
          <p className="text-[13px] text-[#0a84ff] mb-2">scull</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">row a note across.</h1>
          <p className="text-neutral-400 text-sm mb-6">open a local text file, or type here. filing writes a real file into the share database and gives Discord a card. long notes are kept; only the card line is short.</p>
          <input value={name} onChange={(e) => setName(e.target.value.slice(0, 80))} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none" />
          <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="paste, or drop a .txt" className="mt-3 w-full min-h-48 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); fromFile(e.dataTransfer.files?.[0] || null); }} />
          <div className="mt-4 flex gap-2">
            <label className="px-4 py-2 rounded-full bg-white/5 text-sm cursor-pointer">open local<input type="file" accept=".txt,.md,.csv,text/plain" className="hidden" onChange={(e) => fromFile(e.target.files?.[0] || null)} /></label>
            <button disabled={!text.trim() || busy} onClick={send} className="px-5 py-2 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">{busy ? 'filing…' : 'file the note'}</button>
          </div>
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {link && <p className="text-xs text-neutral-300 mt-4 break-all">discord link copied: {link}</p>}
        </motion.div>
      </div>
    </div>
  );
}
