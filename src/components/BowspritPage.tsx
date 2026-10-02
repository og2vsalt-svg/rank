import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function BowspritPage() {
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');
  const [card, setCard] = useState('');

  const slow = useMemo(() => (file && file.size > 12 * 1024 * 1024 ? 'large file. the send may feel slow. nothing is refused.' : ''), [file]);

  async function fileIt() {
    setErr('');
    setWarn('');
    if (!note.trim() && !file) {
      setErr('write a line, or attach a local file.');
      return;
    }
    setBusy(true);
    const payload = file || new File([note], `${(title || 'bowsprit').slice(0, 40)}.txt`, { type: 'text/plain' });
    const res = await publishLocalFile(payload, {
      cardTitle: title.trim() || payload.name,
      caption: note.trim().slice(0, 280),
      author: 'bowsprit',
      color: '#0A84FF',
    });
    setBusy(false);
    if (!res.ok || !res.id) {
      setErr(res.error || 'the share table did not take it.');
      return;
    }
    setCard(res.embed || shareUrls(res.id).embed);
    if (res.warn || slow) setWarn(res.warn || slow);
  }

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] uppercase tracking-[0.16em] text-zinc-500">bowsprit</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="mt-2 text-4xl font-semibold tracking-tight">A cover, then the file.</motion.h1>
        <p className="mt-3 text-[15px] leading-relaxed text-zinc-400">Not a drawer. Write the line Discord should show, attach a local file if you have one, and file both into the share table.</p>
        <div className="mt-8 space-y-3 rounded-[28px] border border-white/10 bg-white/[0.04] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur-xl">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="card title" className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-[#0A84FF]/60" />
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="the line on the card" rows={4} className="w-full resize-none rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-[#0A84FF]/60" />
          <label className="block cursor-pointer rounded-2xl border border-dashed border-white/15 px-4 py-4 text-sm text-zinc-400 transition hover:border-white/30">
            {file ? file.name : 'optional local file'}
            <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
          {slow && <p className="text-xs text-amber-200/80">{slow}</p>}
          <button onClick={fileIt} disabled={busy} className="w-full rounded-full bg-white py-3 text-sm font-medium text-black transition active:scale-[0.98] disabled:opacity-60">{busy ? 'filing…' : 'file to the share table'}</button>
          {err && <p className="text-sm text-red-300">{err}</p>}
          {warn && <p className="text-xs text-amber-200/80">{warn}</p>}
          {card && (
            <button onClick={() => navigator.clipboard.writeText(card)} className="w-full rounded-2xl bg-[#0A84FF]/15 px-3 py-3 text-left text-xs text-[#9ecbff]">{card}<span className="mt-1 block text-[11px] text-zinc-400">copied when you tap. paste it in Discord.</span></button>
          )}
        </div>
      </main>
    </div>
  );
}
