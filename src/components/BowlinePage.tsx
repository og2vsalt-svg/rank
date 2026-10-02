import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

export default function BowlinePage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [embed, setEmbed] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const send = async () => {
    const text = body.trim();
    if (!text) return;
    const name = (title.trim() || 'bowline').replace(/[^a-z0-9._-]+/gi, '-').slice(0, 60) + '.txt';
    const file = new File([text], name, { type: 'text/plain' });
    setBusy(true);
    setError('');
    const res = await publishLocalFile(file, { caption: title.trim() || 'bowline note', color: '#30D158' });
    setBusy(false);
    if (!res.ok || !res.id) {
      setError(res.error || 'the knot slipped');
      return;
    }
    setEmbed(res.embed || '');
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] uppercase tracking-[0.16em] text-white/45">bowline</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">a knot you can hand over</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">
            Write in the tab. Filing turns the note into a text drop in the share table. Paste the /s link in Discord and the card unfurls. Not a cabinet, and not a size limit.
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass mt-8 rounded-3xl p-5">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="what the knot is called" className="w-full rounded-2xl bg-black/30 px-4 py-3 text-[15px] outline-none placeholder:text-white/30" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="the note itself" rows={8} className="mt-3 w-full resize-y rounded-2xl bg-black/30 px-4 py-3 text-[15px] leading-relaxed outline-none placeholder:text-white/30" />
          <button onClick={send} disabled={!body.trim() || busy} className="mt-4 rounded-full bg-white px-5 py-2.5 text-[14px] font-medium text-black transition hover:bg-neutral-200 disabled:opacity-50">{busy ? 'tying…' : 'file the knot'}</button>
          {error && <p className="mt-3 text-[13px] text-red-300/90">{error}</p>}
          {embed && (
            <div className="mt-4 flex items-center gap-2">
              <p className="min-w-0 flex-1 truncate text-[13px] text-white/70">{embed}</p>
              <button onClick={async () => { await navigator.clipboard.writeText(embed); setCopied(true); }} className="shrink-0 rounded-full bg-white/10 px-3 py-1.5 text-[12px]">{copied ? 'copied' : 'copy'}</button>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
