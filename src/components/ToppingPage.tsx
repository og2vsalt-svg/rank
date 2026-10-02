import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

const chips = ['#0A84FF', '#64D2FF', '#30D158', '#FF9F0A', '#FF375F', '#BF5AF2'];

export default function ToppingPage() {
  const [file, setFile] = useState<File | null>(null);
  const [label, setLabel] = useState('');
  const [color, setColor] = useState(chips[0]);
  const [busy, setBusy] = useState(false);
  const [embed, setEmbed] = useState('');
  const [error, setError] = useState('');
  const [warn, setWarn] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const send = async () => {
    if (!file) return;
    setBusy(true);
    setError('');
    const res = await publishLocalFile(file, { caption: label.trim() || 'topping', color });
    setBusy(false);
    if (!res.ok || !res.id) {
      setError(res.error || 'the lift did not hold');
      return;
    }
    setEmbed(res.embed || '');
    setWarn(res.warn || (file.size > 12_000_000 ? 'large file. the send may feel slow. nothing is refused for size.' : null));
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] uppercase tracking-[0.16em] text-white/45">topping</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">a colour on the lift</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">
            Stamp a local file with a colour and a short label, then file it. The share table keeps the row. Discord uses the colour on the card. No cutoff, only a slowness note if the file is heavy.
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="glass mt-8 rounded-3xl p-5">
          <div className="flex gap-2">
            {chips.map((c) => (
              <button key={c} onClick={() => setColor(c)} aria-label={c} className="h-8 w-8 rounded-full transition" style={{ background: c, outline: color === c ? '2px solid white' : 'none', outlineOffset: 2 }} />
            ))}
          </div>
          <label className="mt-4 flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-black/20 text-center">
            <input type="file" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <span className="text-[14px] text-white/80">{file ? file.name : 'choose a local file'}</span>
          </label>
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="label on the card" className="mt-3 w-full rounded-2xl bg-black/30 px-4 py-3 text-[15px] outline-none placeholder:text-white/30" />
          <button onClick={send} disabled={!file || busy} className="mt-4 rounded-full bg-white px-5 py-2.5 text-[14px] font-medium text-black transition hover:bg-neutral-200 disabled:opacity-50">{busy ? 'lifting…' : 'file the lift'}</button>
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
