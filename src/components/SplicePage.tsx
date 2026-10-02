import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return Math.max(1, Math.round(n / 1024)) + ' KB';
  return (n / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function SplicePage() {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [names, setNames] = useState<[string, string]>(['first', 'second']);
  const [join, setJoin] = useState('\n\n— — —\n\n');
  const [busy, setBusy] = useState(false);
  const [card, setCard] = useState('');
  const [error, setError] = useState('');
  const [warn, setWarn] = useState<string | null>(null);

  const preview = useMemo(() => a + join + b, [a, b, join]);
  const slow = preview.length > 400_000 ? 'long splice. the tab may feel slow while it sends. nothing is refused.' : null;

  const read = async (file: File, slot: 0 | 1) => {
    const text = await file.text();
    if (slot === 0) setA(text);
    else setB(text);
    setNames((prev) => {
      const next: [string, string] = [...prev];
      next[slot] = file.name;
      return next;
    });
  };

  const send = async () => {
    if (!a && !b) return;
    setBusy(true);
    setError('');
    const file = new File([preview], 'splice.txt', { type: 'text/plain' });
    const res = await publishLocalFile(file, { caption: `splice · ${names[0]} + ${names[1]}`, color: '#0A84FF' });
    setBusy(false);
    if (!res.ok) {
      setError(res.error || 'the splice did not land');
      return;
    }
    setWarn(res.warn || slow);
    setCard(res.embed || '');
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] uppercase tracking-[0.16em] text-zinc-500">splice</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-2 text-4xl font-semibold tracking-tight text-zinc-50">Two drafts, one card.</motion.h1>
        <p className="mt-3 max-w-xl text-zinc-400">Open two local texts, look at the join, then file the combined note. The bytes go to the share table. Discord unfurls /s. Large splices are warned, never cut.</p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <label className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-zinc-300">first draft
            <input type="file" accept="text/plain,.txt,.md,.csv,.json" className="mt-2 block w-full text-zinc-400" onChange={(e) => e.target.files?.[0] && read(e.target.files[0], 0)} />
            <span className="mt-2 block text-zinc-500">{names[0]} · {pretty(a.length)}</span>
          </label>
          <label className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-zinc-300">second draft
            <input type="file" accept="text/plain,.txt,.md,.csv,.json" className="mt-2 block w-full text-zinc-400" onChange={(e) => e.target.files?.[0] && read(e.target.files[0], 1)} />
            <span className="mt-2 block text-zinc-500">{names[1]} · {pretty(b.length)}</span>
          </label>
        </div>
        <textarea value={join} onChange={(e) => setJoin(e.target.value)} className="mt-3 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-zinc-100 outline-none" />
        <pre className="mt-3 max-h-56 overflow-auto rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-zinc-300 whitespace-pre-wrap">{preview.slice(0, 2400) || 'the join shows here'}</pre>
        {slow && <p className="mt-2 text-sm text-amber-200">{slow}</p>}
        <button disabled={busy || (!a && !b)} onClick={send} className="mt-4 rounded-full bg-[#0A84FF] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-40">{busy ? 'filing…' : 'file the splice'}</button>
        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
        {warn && <p className="mt-3 text-sm text-amber-200">{warn}</p>}
        {card && <a className="mt-3 block text-sm text-[#7ab8ff] underline" href={card}>{card}</a>}
      </main>
    </div>
  );
}
