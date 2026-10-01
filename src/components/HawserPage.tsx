import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

const WINDOWS = [
  { id: 'open', label: 'leave it', hours: 0 },
  { id: 'day', label: 'a day', hours: 24 },
  { id: 'week', label: 'a week', hours: 24 * 7 },
];

export default function HawserPage() {
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [from, setFrom] = useState('');
  const [windowId, setWindowId] = useState('open');
  const [busy, setBusy] = useState(false);
  const [card, setCard] = useState('');
  const [plain, setPlain] = useState('');
  const [error, setError] = useState('');
  const [warn, setWarn] = useState<string | null>(null);
  const [copied, setCopied] = useState('');

  const sizeLabel = useMemo(() => {
    if (!file) return '';
    const mb = file.size / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(file.size / 1024))} KB`;
  }, [file]);

  const send = async () => {
    if (!file) return;
    setBusy(true);
    setError('');
    setCopied('');
    const picked = WINDOWS.find((w) => w.id === windowId);
    const expiresAt = picked && picked.hours ? new Date(Date.now() + picked.hours * 3600 * 1000).toISOString() : null;
    const res = await publishLocalFile(file, {
      caption: note.trim().slice(0, 180),
      author: from.trim(),
      expiresAt,
      color: '#5E5CE6',
    });
    setBusy(false);
    if (!res.ok || !res.id) {
      setError(res.error || 'the hawser did not take');
      return;
    }
    const urls = shareUrls(res.id);
    setCard(res.embed || urls.embed);
    setPlain(urls.open);
    setWarn(res.warn || (file.size > 18 * 1024 * 1024 ? 'heavy line. the tab may pause while it pays out. nothing is refused.' : null));
  };

  const copy = async (which: string, value: string) => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(which);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] uppercase tracking-[0.16em] text-white/45">hawser</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">both ends of the line</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">A local file goes into the share table with a handoff note. Discord gets the card link. A person gets the plain open link. Expiry is a choice, not a ceiling.</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.55 }} className="glass mt-8 rounded-3xl p-5">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-black/25 px-4 py-10 text-center transition hover:border-white/30">
            <span className="text-[15px] text-white">{file ? file.name : 'choose the file to pass'}</span>
            <span className="mt-1 text-[13px] text-white/45">{file ? sizeLabel : 'from this machine'}</span>
            <input type="file" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="handoff note — what the other end should know" rows={3} className="mt-3 w-full resize-none rounded-2xl bg-black/30 px-4 py-3 text-[15px] outline-none placeholder:text-white/30" />
          <input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="from" className="mt-3 w-full rounded-2xl bg-black/30 px-4 py-3 text-[15px] outline-none placeholder:text-white/30" />
          <div className="mt-3 flex flex-wrap gap-2">
            {WINDOWS.map((w) => (
              <button key={w.id} onClick={() => setWindowId(w.id)} className={`rounded-full px-3.5 py-1.5 text-[13px] transition ${windowId === w.id ? 'bg-white text-black' : 'bg-white/8 text-white/70 hover:bg-white/12'}`}>{w.label}</button>
            ))}
          </div>
          <button onClick={send} disabled={!file || busy} className="mt-4 rounded-full bg-white px-5 py-2.5 text-[14px] font-medium text-black transition hover:bg-neutral-200 disabled:opacity-50">{busy ? 'paying out…' : 'make the hawser'}</button>
          {warn && <p className="mt-3 text-[13px] text-amber-200/80">{warn}</p>}
          {error && <p className="mt-3 text-[13px] text-red-300/90">{error}</p>}
          {card && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2">
                <p className="min-w-0 flex-1 truncate text-[13px] text-white/70">{card}</p>
                <button onClick={() => copy('card', card)} className="shrink-0 rounded-full bg-white/10 px-3 py-1.5 text-[12px] text-white">{copied === 'card' ? 'copied' : 'discord'}</button>
              </div>
              <div className="flex items-center gap-2">
                <p className="min-w-0 flex-1 truncate text-[13px] text-white/50">{plain}</p>
                <button onClick={() => copy('plain', plain)} className="shrink-0 rounded-full bg-white/10 px-3 py-1.5 text-[12px] text-white">{copied === 'plain' ? 'copied' : 'plain'}</button>
              </div>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
