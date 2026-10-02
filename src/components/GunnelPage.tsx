import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

export default function GunnelPage() {
  const [kept, setKept] = useState('');
  const [sent, setSent] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [card, setCard] = useState('');
  const [copied, setCopied] = useState(false);

  const words = useMemo(() => (kept + ' ' + sent).trim().split(/\s+/).filter(Boolean).length, [kept, sent]);

  const send = async () => {
    if (!kept.trim() && !sent.trim()) return;
    setBusy(true);
    setError('');
    const body = [`kept`, kept.trim() || '—', '', `sent`, sent.trim() || '—', ''].join('\n');
    const file = new File([body], 'gunnel.txt', { type: 'text/plain' });
    const res = await publishLocalFile(file, { caption: `kept ${kept.trim().slice(0, 60) || '—'} / sent ${sent.trim().slice(0, 60) || '—'}` });
    setBusy(false);
    if (!res.ok || !res.embed) {
      setError(res.error || 'the rail did not take it');
      return;
    }
    setCard(res.embed);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] uppercase tracking-[0.16em] text-white/45">gunnel</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">what stays, what leaves</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">Two columns on the rail. Nothing is stored until you file the pair as a text drop. Discord unfurls that card. This is a writing desk, not the vault.</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.5 }} className="mt-8 grid gap-3 sm:grid-cols-2">
          <label className="glass rounded-3xl p-4">
            <span className="text-[12px] uppercase tracking-[0.14em] text-white/40">kept</span>
            <textarea value={kept} onChange={(e) => setKept(e.target.value)} rows={8} className="mt-2 w-full resize-none bg-transparent text-[15px] leading-relaxed outline-none placeholder:text-white/25" placeholder="stays on this side" />
          </label>
          <label className="glass rounded-3xl p-4">
            <span className="text-[12px] uppercase tracking-[0.14em] text-white/40">sent</span>
            <textarea value={sent} onChange={(e) => setSent(e.target.value)} rows={8} className="mt-2 w-full resize-none bg-transparent text-[15px] leading-relaxed outline-none placeholder:text-white/25" placeholder="goes over the rail" />
          </label>
        </motion.div>
        <div className="mt-4 flex items-center gap-3">
          <button onClick={send} disabled={busy || (!kept.trim() && !sent.trim())} className="rounded-full bg-white px-5 py-2.5 text-[14px] font-medium text-black transition hover:bg-neutral-200 disabled:opacity-50">{busy ? 'filing…' : 'file the pair'}</button>
          <span className="text-[13px] text-white/40">{words} words</span>
        </div>
        {error && <p className="mt-3 text-[13px] text-red-300/90">{error}</p>}
        {card && (
          <div className="mt-4 flex items-center gap-2">
            <p className="min-w-0 flex-1 truncate text-[13px] text-white/70">{card}</p>
            <button onClick={async () => { await navigator.clipboard.writeText(card); setCopied(true); }} className="shrink-0 rounded-full bg-white/10 px-3 py-1.5 text-[12px] text-white">{copied ? 'copied' : 'copy'}</button>
          </div>
        )}
      </main>
    </div>
  );
}
