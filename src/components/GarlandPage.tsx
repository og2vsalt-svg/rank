import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

const ACCENTS = ['#0A84FF', '#64D2FF', '#30D158', '#FF9F0A', '#FF375F', '#BF5AF2'];

export default function GarlandPage() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState(ACCENTS[0]);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [card, setCard] = useState('');

  const take = (next: File | null) => {
    setFile(next);
    setErr('');
    setCard('');
    if (!next) return;
    if (!title) setTitle(next.name.replace(/\.[^.]+$/, ''));
    setWarn(next.size > 18 * 1024 * 1024 ? 'large file. the send may feel slow. nothing is refused.' : '');
  };

  const send = async () => {
    if (!file) return;
    setBusy(true);
    setErr('');
    try {
      const result = await publishLocalFile(file, {
        caption: caption.trim() || file.name,
        cardTitle: title.trim() || file.name,
        color: accent,
        author: 'garland',
      });
      if (!result.ok || !result.id) {
        setErr(result.error || 'the file did not land');
        return;
      }
      const url = shareUrls(result.id).embed;
      setCard(url);
      if (result.warn) setWarn(result.warn);
      try { await navigator.clipboard.writeText(url); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'send failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#64d2ff] text-sm mb-2">garland</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a file, with a colour on the card.</h1>
          <p className="text-neutral-400 text-sm mb-6">pick a local file. it lands in the share table, and Discord unfurls /s with the accent you chose. no size cap.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#64d2ff]/50 p-8 text-center transition duration-300">
            <input type="file" className="hidden" onChange={(e) => take(e.target.files?.[0] || null)} />
            <p className="text-sm text-white">{file ? file.name : 'drop a local file'}</p>
            <p className="text-xs text-neutral-500 mt-1">{file ? `${Math.max(1, Math.round(file.size / 1024))} KB` : 'warned if it may feel slow. never refused.'}</p>
          </label>
          <div className="mt-4 space-y-3">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="card title" className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#64d2ff]/40" />
            <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="line Discord should show" className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#64d2ff]/40" />
            <div className="flex gap-2">
              {ACCENTS.map((c) => (
                <button key={c} type="button" onClick={() => setAccent(c)} aria-label={c} className="h-8 w-8 rounded-full transition duration-300" style={{ background: c, outline: accent === c ? '2px solid white' : '2px solid transparent', outlineOffset: 2 }} />
              ))}
            </div>
            <button onClick={send} disabled={busy || !file} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50">{busy ? 'sending…' : 'file it'}</button>
          </div>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {card && <p className="text-xs text-neutral-400 mt-4 break-all">copied {card}</p>}
        </motion.div>
      </div>
    </div>
  );
}
