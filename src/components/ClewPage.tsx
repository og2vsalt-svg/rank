import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

export default function ClewPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sign, setSign] = useState('');
  const [busy, setBusy] = useState(false);
  const [embed, setEmbed] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);

  const letter = useMemo(() => {
    const head = title.trim() || 'untitled letter';
    const who = sign.trim() ? `\n\n— ${sign.trim()}` : '';
    return `${head}\n\n${body.trim()}${who}\n`;
  }, [title, body, sign]);

  const send = async () => {
    if (!body.trim()) return;
    setBusy(true);
    setError('');
    const file = new File([letter], `${(title.trim() || 'letter').slice(0, 48).replace(/[^\w.-]+/g, '-')}.txt`, {
      type: 'text/plain',
    });
    const res = await publishLocalFile(file, {
      caption: title.trim().slice(0, 140) || 'a letter from clew',
      author: sign.trim() || undefined,
      color: '#64D2FF',
    });
    setBusy(false);
    if (!res.ok || !res.id) {
      setError(res.error || 'the letter did not leave');
      return;
    }
    setEmbed(res.embed || '');
    setWarn(res.warn || (file.size > 200_000 ? 'long letter. the send may feel slow. there is no cutoff.' : null));
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] uppercase tracking-[0.16em] text-white/45">clew</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">a letter, not a cabinet</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">
            Write in the tab. Sending turns the letter into a text file on the share table and hands you a Discord card. Nothing is refused for length — a very long one may just feel slow.
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="glass mt-8 rounded-3xl p-5">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="subject" className="w-full rounded-2xl bg-black/30 px-4 py-3 text-[15px] outline-none placeholder:text-white/30" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="the letter" rows={8} className="mt-3 w-full resize-y rounded-2xl bg-black/30 px-4 py-3 text-[15px] leading-relaxed outline-none placeholder:text-white/30" />
          <input value={sign} onChange={(e) => setSign(e.target.value)} placeholder="signed" className="mt-3 w-full rounded-2xl bg-black/30 px-4 py-3 text-[15px] outline-none placeholder:text-white/30" />
          <button onClick={send} disabled={!body.trim() || busy} className="mt-4 rounded-full bg-white px-5 py-2.5 text-[14px] font-medium text-black transition hover:bg-neutral-200 disabled:opacity-50">
            {busy ? 'filing…' : 'file the letter'}
          </button>
          {warn && <p className="mt-3 text-[13px] text-amber-200/80">{warn}</p>}
          {error && <p className="mt-3 text-[13px] text-red-300/90">{error}</p>}
          {embed && (
            <div className="mt-4 flex items-center gap-2">
              <p className="min-w-0 flex-1 truncate text-[13px] text-white/70">{embed}</p>
              <button onClick={async () => { await navigator.clipboard.writeText(embed); setCopied(true); }} className="shrink-0 rounded-full bg-white/10 px-3 py-1.5 text-[12px] text-white">{copied ? 'copied' : 'copy'}</button>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
