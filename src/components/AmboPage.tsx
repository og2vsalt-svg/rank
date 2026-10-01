import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function AmboPage() {
  const [title, setTitle] = useState('evening reading');
  const [body, setBody] = useState('Stand here. Read it once out loud before you send it.');
  const [wpm, setWpm] = useState(140);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [id, setId] = useState('');
  const [copied, setCopied] = useState(false);

  const words = body.trim() ? body.trim().split(/\s+/).length : 0;
  const minutes = useMemo(() => (words ? words / Math.max(80, wpm) : 0), [words, wpm]);
  const warn = body.length > 80_000 ? 'long lectern text. the tab may feel slow when it ships.' : null;

  const send = async () => {
    setBusy(true);
    setErr('');
    const text = `# ${title}\n\n${body}\n\n_${words} words · about ${minutes.toFixed(1)} min at ${wpm} wpm_\n`;
    const dataUrl = `data:text/markdown;charset=utf-8,${encodeURIComponent(text)}`;
    const next = uid();
    const res = await publishShare({
      id: next,
      name: `${title || 'reading'}.md`,
      type: 'text/markdown',
      size: new Blob([text]).size,
      dataUrl,
      caption: `${words} words · ${minutes.toFixed(1)} min`,
    });
    setBusy(false);
    if (!res.ok || !res.id) {
      setErr(res.error || 'could not place the reading');
      return;
    }
    setId(res.id);
  };

  const card = id ? shareUrls(id).embed : '';

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] uppercase tracking-[0.16em] text-white/45">ambo</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">a lectern, not a vault</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">
            Time a passage, then hang the markdown on the share table if you want a Discord card. Nothing is capped. Heavy drafts only get a slowness note.
          </p>
        </motion.div>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="glass mt-8 w-full rounded-2xl px-4 py-3 text-[15px] outline-none" />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10} className="glass mt-3 w-full rounded-3xl px-4 py-3 text-[15px] leading-relaxed outline-none" />
        <div className="mt-4 flex items-center justify-between gap-3 text-[13px] text-white/55">
          <span>{words} words · {minutes.toFixed(1)} min</span>
          <label className="flex items-center gap-2">
            pace
            <input type="number" min={80} max={220} value={wpm} onChange={(e) => setWpm(Number(e.target.value) || 140)} className="w-16 rounded-full bg-white/10 px-2 py-1 text-white outline-none" />
          </label>
        </div>
        {warn && <p className="mt-3 text-[13px] text-amber-200/80">{warn}</p>}
        <button onClick={send} disabled={!body.trim() || busy} className="mt-4 w-full rounded-full bg-[#0A84FF] px-4 py-3 text-[15px] font-medium text-white disabled:opacity-40">
          {busy ? 'placing the reading…' : 'publish the reading'}
        </button>
        {err && <p className="mt-3 text-[13px] text-red-300">{err}</p>}
        {card && (
          <div className="glass mt-6 rounded-3xl p-5">
            <p className="text-[13px] text-white/50">discord card</p>
            <p className="mt-1 break-all text-[15px]">{card}</p>
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(card);
                setCopied(true);
                setTimeout(() => setCopied(false), 1200);
              }}
              className="mt-3 rounded-full bg-white/10 px-3 py-1.5 text-[13px]"
            >
              {copied ? 'copied' : 'copy /s link'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
