import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function BeakheadPage() {
  const [title, setTitle] = useState('');
  const [line, setLine] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [cards, setCards] = useState<string[]>([]);

  const take = (next: File | null) => {
    setFile(next);
    setErr('');
    if (!next) return;
    setWarn(next.size > 18 * 1024 * 1024 ? 'large companion. the send may feel slow. nothing is refused.' : '');
  };

  const send = async () => {
    if (!title.trim() && !line.trim() && !file) return;
    setBusy(true);
    setErr('');
    setCards([]);
    const next: string[] = [];
    try {
      const note = new File([`${title.trim() || 'beakhead'}\n\n${line.trim()}\n`], `${(title || 'beakhead').slice(0, 40).replace(/[^a-z0-9]+/gi, '-') || 'beakhead'}.txt`, { type: 'text/plain' });
      const noteResult = await publishLocalFile(note, {
        caption: line.trim() || title.trim(),
        cardTitle: title.trim() || 'beakhead slip',
        color: '#64D2FF',
        author: 'beakhead',
      });
      if (!noteResult.ok || !noteResult.id) {
        setErr(noteResult.error || 'the slip did not land');
        return;
      }
      next.push(shareUrls(noteResult.id).embed);
      if (file) {
        const fileResult = await publishLocalFile(file, {
          caption: line.trim() || file.name,
          cardTitle: file.name,
          color: '#0A84FF',
          author: 'beakhead',
        });
        if (!fileResult.ok || !fileResult.id) {
          setErr(fileResult.error || 'the companion did not land');
        } else {
          next.push(shareUrls(fileResult.id).embed);
          if (fileResult.warn) setWarn(fileResult.warn);
        }
      }
      setCards(next);
      try { await navigator.clipboard.writeText(next[0]); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'handover failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#64d2ff] text-sm mb-2">beakhead</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a handover, not a drawer.</h1>
          <p className="text-neutral-400 text-sm mb-6">write the line. attach a local file only if the person needs the bytes. both land in the share table, each with its own Discord card.</p>
          <div className="space-y-3">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="card title" className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#64d2ff]/40" />
            <textarea value={line} onChange={(e) => setLine(e.target.value)} placeholder="what they should know" rows={4} className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#64d2ff]/40 resize-none" />
            <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#64d2ff]/50 p-6 text-center transition duration-300">
              <input type="file" className="hidden" onChange={(e) => take(e.target.files?.[0] || null)} />
              <p className="text-sm text-white">{file ? file.name : 'optional local file'}</p>
              <p className="text-xs text-neutral-500 mt-1">no size cap. a warning only if it may feel slow.</p>
            </label>
            <button onClick={send} disabled={busy} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50">{busy ? 'sending…' : 'file the handover'}</button>
          </div>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {cards.length > 0 && (
            <ul className="mt-4 space-y-1">
              {cards.map((url) => <li key={url} className="text-xs text-neutral-400 break-all">{url}</li>)}
            </ul>
          )}
        </motion.div>
      </div>
    </div>
  );
}
