import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare } from '../lib/cloudShare';

type Watch = { id: string; name: string; when: string; done: boolean };

const ease = [0.22, 1, 0.36, 1] as const;

export default function BosunPage() {
  const [name, setName] = useState('');
  const [when, setWhen] = useState('');
  const [items, setItems] = useState<Watch[]>([]);
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState('');
  const [err, setErr] = useState('');

  const add = () => {
    if (!name.trim()) return;
    setItems((prev) => [{ id: Date.now().toString(36), name: name.trim(), when: when.trim(), done: false }, ...prev]);
    setName('');
    setWhen('');
  };

  const file = async () => {
    if (!items.length) return;
    setBusy(true);
    setErr('');
    const body = ['# watch', '', ...items.map((item) => `- [${item.done ? 'x' : ' '}] ${item.name}${item.when ? ` — ${item.when}` : ''}`)].join('\n');
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    const dataUrl = `data:text/markdown;base64,${btoa(unescape(encodeURIComponent(body)))}`;
    const res = await publishShare({
      id,
      name: 'watch.md',
      type: 'text/markdown',
      size: body.length,
      dataUrl,
      caption: `${items.length} on the watch`,
    });
    if (!res.ok) setErr(res.error || 'watch did not file');
    else setLink(`${location.origin}/s/${res.id}`);
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] uppercase tracking-[0.18em] text-zinc-500">bosun</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }} className="mt-2 text-4xl font-semibold tracking-tight text-zinc-50">A watch, not a cabinet.</motion.h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-zinc-400">Keep names and times in the tab. Filing writes one markdown drop to the share database so Discord can unfurl the list.</p>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.5, ease }} className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr_auto]">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="what to watch" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-[#0A84FF]/70" />
            <input value={when} onChange={(e) => setWhen(e.target.value)} placeholder="when" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-[#0A84FF]/70" />
            <button onClick={add} className="rounded-full bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-zinc-200 active:scale-[0.98]">add</button>
          </div>
          <ul className="mt-5 space-y-2">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-black/20 px-3 py-2.5">
                <button onClick={() => setItems((prev) => prev.map((row) => row.id === item.id ? { ...row, done: !row.done } : row))} className={`h-5 w-5 rounded-full border transition ${item.done ? 'border-[#0A84FF] bg-[#0A84FF]' : 'border-white/20'}`} aria-label="toggle" />
                <span className={`flex-1 text-sm ${item.done ? 'text-zinc-500 line-through' : 'text-zinc-100'}`}>{item.name}</span>
                <span className="text-xs text-zinc-500">{item.when}</span>
              </li>
            ))}
          </ul>
          <button disabled={busy || !items.length} onClick={file} className="mt-5 rounded-full border border-white/15 px-5 py-2.5 text-sm text-white transition hover:bg-white/5 disabled:opacity-40">{busy ? 'filing…' : 'file the watch'}</button>
          {err && <p className="mt-3 text-sm text-rose-300">{err}</p>}
          {link && <a className="mt-3 inline-block text-sm text-[#0A84FF]" href={link}>{link}</a>}
        </motion.div>
      </main>
    </div>
  );
}
