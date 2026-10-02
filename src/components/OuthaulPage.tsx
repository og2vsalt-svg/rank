import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

export default function OuthaulPage() {
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [who, setWho] = useState('');
  const [busy, setBusy] = useState(false);
  const [embed, setEmbed] = useState('');
  const [error, setError] = useState('');
  const [warn, setWarn] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const send = async () => {
    if (!file) return;
    setBusy(true);
    setError('');
    const res = await publishLocalFile(file, {
      caption: note.trim().slice(0, 180) || 'outhaul handoff',
      author: who.trim() || undefined,
      color: '#5E5CE6',
    });
    setBusy(false);
    if (!res.ok || !res.id) {
      setError(res.error || 'the line did not take');
      return;
    }
    setEmbed(res.embed || '');
    setWarn(res.warn || (file.size > 12_000_000 ? 'large file. the send may feel slow. nothing is refused for size.' : null));
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] uppercase tracking-[0.16em] text-white/45">outhaul</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">a handoff, not a cabinet</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">
            Pick a file on this machine, write who it is for, and file it. The row lands in the share table. Paste the /s link in Discord and the card unfurls. Large files are warned, never cut off.
          </p>
        </motion.div>
        <motion.label
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.55 }}
          className="mt-8 flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-white/15 bg-white/[0.03] px-6 text-center transition hover:border-white/30 hover:bg-white/[0.05]"
        >
          <input type="file" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <span className="text-[15px] text-white/80">{file ? file.name : 'choose a local file'}</span>
          <span className="mt-1 text-[12px] text-white/40">{file ? `${Math.max(1, Math.round(file.size / 1024))} KB on this machine` : 'nothing leaves until you file it'}</span>
        </motion.label>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.16 }} className="glass mt-4 rounded-3xl p-5">
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="what this is for" className="w-full rounded-2xl bg-black/30 px-4 py-3 text-[15px] outline-none placeholder:text-white/30" />
          <input value={who} onChange={(e) => setWho(e.target.value)} placeholder="from" className="mt-3 w-full rounded-2xl bg-black/30 px-4 py-3 text-[15px] outline-none placeholder:text-white/30" />
          <button onClick={send} disabled={!file || busy} className="mt-4 rounded-full bg-white px-5 py-2.5 text-[14px] font-medium text-black transition duration-200 hover:bg-neutral-200 disabled:opacity-50">
            {busy ? 'hauling…' : 'file the handoff'}
          </button>
          {warn && <p className="mt-3 text-[13px] text-amber-200/80">{warn}</p>}
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
