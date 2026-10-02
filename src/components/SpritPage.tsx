import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

const STARTERS = ['#0A84FF', '#FF9F0A', '#30D158', '#FF375F', '#BF5AF2', '#F5F5F7'];

export default function SpritPage() {
  const [name, setName] = useState('evening board');
  const [swatches, setSwatches] = useState(STARTERS);
  const [draft, setDraft] = useState('#64D2FF');
  const [busy, setBusy] = useState(false);
  const [embed, setEmbed] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const add = () => {
    const hex = draft.trim();
    if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return;
    setSwatches((prev) => [...prev, hex.toUpperCase()]);
  };

  const send = async () => {
    setBusy(true);
    setError('');
    const payload = { name: name.trim() || 'board', swatches, made: new Date().toISOString() };
    const file = new File([JSON.stringify(payload, null, 2)], `${(name.trim() || 'board').replace(/[^\w.-]+/g, '-')}.json`, {
      type: 'application/json',
    });
    const res = await publishLocalFile(file, { caption: `${swatches.length} swatches · ${name.trim() || 'board'}`, color: swatches[0] });
    setBusy(false);
    if (!res.ok || !res.id) {
      setError(res.error || 'the board did not file');
      return;
    }
    setEmbed(res.embed || '');
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] uppercase tracking-[0.16em] text-white/45">sprit</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">a board of colour</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">
            This is not the vault. Mix a swatch board in the tab, then file it as JSON so someone else can open the same colours. Discord gets the card. No size ceiling.
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="glass mt-8 rounded-3xl p-5">
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-2xl bg-black/30 px-4 py-3 text-[15px] outline-none" />
          <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {swatches.map((hex, i) => (
              <button key={`${hex}-${i}`} onClick={() => setSwatches((prev) => prev.filter((_, n) => n !== i))} className="aspect-square rounded-2xl border border-white/10 transition hover:scale-[1.03]" style={{ background: hex }} title="remove" />
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <input value={draft} onChange={(e) => setDraft(e.target.value)} className="min-w-0 flex-1 rounded-2xl bg-black/30 px-4 py-3 font-mono text-[14px] outline-none" />
            <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(draft) ? draft : '#64D2FF'} onChange={(e) => setDraft(e.target.value.toUpperCase())} className="h-12 w-12 cursor-pointer rounded-2xl border border-white/10 bg-transparent" />
            <button onClick={add} className="rounded-full bg-white/10 px-4 text-[13px] text-white">add</button>
          </div>
          <button onClick={send} disabled={busy || swatches.length === 0} className="mt-4 rounded-full bg-white px-5 py-2.5 text-[14px] font-medium text-black disabled:opacity-50">{busy ? 'filing…' : 'file the board'}</button>
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
