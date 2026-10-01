import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

export default function FenderPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [author, setAuthor] = useState('');
  const [busy, setBusy] = useState(false);
  const [embed, setEmbed] = useState('');
  const [error, setError] = useState('');
  const [warn, setWarn] = useState<string | null>(null);

  const send = async () => {
    const name = (title.trim() || 'note').replace(/[^a-z0-9._-]+/gi, '-').slice(0, 60) || 'note';
    const text = `${title.trim() || 'note'}\n\n${body.trim()}\n`;
    const file = new File([text], `${name}.txt`, { type: 'text/plain' });
    setBusy(true);
    setError('');
    const res = await publishLocalFile(file, { caption: body.trim().slice(0, 180), author, color: '#5E5CE6' });
    setBusy(false);
    if (!res.ok || !res.id) {
      setError(res.error || 'the note did not leave');
      return;
    }
    setWarn(res.warn || (file.size > 12 * 1024 * 1024 ? 'long note. the send may feel slow.' : null));
    setEmbed(res.embed || '');
    setBody('');
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] uppercase tracking-[0.16em] text-white/45">fender</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">a note that leaves as a file</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">Write here. It becomes a plain text drop in the share database, with a Discord card on the link. Not a drawer in the vault.</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.5 }} className="glass mt-8 rounded-3xl p-5">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="title" className="w-full rounded-2xl bg-black/30 px-4 py-3 text-[15px] outline-none placeholder:text-white/30" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="the note" rows={7} className="mt-3 w-full resize-none rounded-2xl bg-black/30 px-4 py-3 text-[15px] leading-relaxed outline-none placeholder:text-white/30" />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="from" className="mt-3 w-full rounded-2xl bg-black/30 px-4 py-3 text-[15px] outline-none placeholder:text-white/30" />
          <button onClick={send} disabled={!body.trim() || busy} className="mt-4 rounded-full bg-white px-5 py-2.5 text-[14px] font-medium text-black disabled:opacity-50">{busy ? 'leaving…' : 'leave it'}</button>
          {warn && <p className="mt-3 text-[13px] text-amber-200/80">{warn}</p>}
          {error && <p className="mt-3 text-[13px] text-red-300/90">{error}</p>}
          {embed && <p className="mt-3 truncate text-[13px] text-white/70">{embed}</p>}
        </motion.div>
      </main>
    </div>
  );
}
