import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

export default function LuffPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [pick, setPick] = useState(0);
  const [busy, setBusy] = useState(false);
  const [embed, setEmbed] = useState('');
  const [error, setError] = useState('');
  const [warn, setWarn] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const chosen = files[pick];

  const send = async () => {
    if (!chosen) return;
    setBusy(true);
    setError('');
    const res = await publishLocalFile(chosen, { caption: `luff kept ${chosen.name}`, color: '#FF9F0A' });
    setBusy(false);
    if (!res.ok || !res.id) {
      setError(res.error || 'that one did not leave');
      return;
    }
    setEmbed(res.embed || '');
    setWarn(res.warn || (chosen.size > 12_000_000 ? 'heavy file. sending may feel slow. there is no cutoff.' : null));
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] uppercase tracking-[0.16em] text-white/45">luff</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">keep one, file that one</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">
            Drop a few local files. They stay in the tab until you choose one. Only the chosen file is written to the share table. The others never leave this machine.
          </p>
        </motion.div>
        <motion.label initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 block cursor-pointer rounded-3xl border border-dashed border-white/15 px-5 py-8 text-center text-[14px] text-white/70 hover:border-white/30">
          <input type="file" multiple className="sr-only" onChange={(e) => { const list = Array.from(e.target.files || []); setFiles(list); setPick(0); }} />
          {files.length ? `${files.length} on the table` : 'choose local files'}
        </motion.label>
        <div className="mt-4 space-y-2">
          {files.map((f, i) => (
            <button key={`${f.name}-${i}`} onClick={() => setPick(i)} className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition ${i === pick ? 'bg-white text-black' : 'bg-white/5 text-white/80 hover:bg-white/10'}`}>
              <span className="truncate text-[14px]">{f.name}</span>
              <span className="shrink-0 text-[12px] opacity-60">{Math.max(1, Math.round(f.size / 1024))} KB</span>
            </button>
          ))}
        </div>
        <button onClick={send} disabled={!chosen || busy} className="mt-5 rounded-full bg-white px-5 py-2.5 text-[14px] font-medium text-black disabled:opacity-50">{busy ? 'filing…' : 'file the chosen one'}</button>
        {warn && <p className="mt-3 text-[13px] text-amber-200/80">{warn}</p>}
        {error && <p className="mt-3 text-[13px] text-red-300/90">{error}</p>}
        {embed && (
          <div className="mt-4 flex items-center gap-2">
            <p className="min-w-0 flex-1 truncate text-[13px] text-white/70">{embed}</p>
            <button onClick={async () => { await navigator.clipboard.writeText(embed); setCopied(true); }} className="shrink-0 rounded-full bg-white/10 px-3 py-1.5 text-[12px]">{copied ? 'copied' : 'copy'}</button>
          </div>
        )}
      </main>
    </div>
  );
}
