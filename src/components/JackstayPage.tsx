import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

const SB = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type Line = { id: string; text: string; done: boolean };

export default function JackstayPage() {
  const [title, setTitle] = useState('');
  const [lines, setLines] = useState<Line[]>([{ id: '1', text: '', done: false }]);
  const [busy, setBusy] = useState(false);
  const [embed, setEmbed] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const add = () => setLines((xs) => [...xs, { id: Math.random().toString(36).slice(2, 8), text: '', done: false }]);
  const body = lines.map((l) => `${l.done ? '[x]' : '[ ]'} ${l.text}`).join('\n');

  const fileIt = async () => {
    const named = title.trim() || 'jackstay';
    if (!body.trim()) return;
    setBusy(true);
    setError('');
    const id = Date.now().toString(36);
    await fetch(`${SB}/rest/v1/yard_slips`, {
      method: 'POST',
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ id, kind: 'jackstay', title: named.slice(0, 160), body: body.slice(0, 20000) }),
    }).catch(() => null);
    const file = new File([`${named}\n\n${body}\n`], `${named.slice(0, 40).replace(/[^\w.-]+/g, '-')}.txt`, { type: 'text/plain' });
    const res = await publishLocalFile(file, { caption: named.slice(0, 140), color: '#30D158' });
    setBusy(false);
    if (!res.ok || !res.id) {
      setError(res.error || 'the list stayed on this tab');
      return;
    }
    setEmbed(res.embed || '');
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] uppercase tracking-[0.16em] text-white/45">jackstay</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">a list you can hand over</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">
            Tick things off here. Filing writes the list to yard_slips and also as a text drop, so Discord gets a card. It is a checklist, not the vault.
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="glass mt-8 rounded-3xl p-5">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="list name" className="w-full rounded-2xl bg-black/30 px-4 py-3 text-[15px] outline-none placeholder:text-white/30" />
          <div className="mt-3 space-y-2">
            {lines.map((line, i) => (
              <motion.div layout key={line.id} className="flex items-center gap-2">
                <button type="button" onClick={() => setLines((xs) => xs.map((x) => x.id === line.id ? { ...x, done: !x.done } : x))} className={`h-5 w-5 shrink-0 rounded-full border transition ${line.done ? 'border-[#30D158] bg-[#30D158]' : 'border-white/25'}`} aria-label="tick" />
                <input value={line.text} onChange={(e) => setLines((xs) => xs.map((x) => x.id === line.id ? { ...x, text: e.target.value } : x))} placeholder={`line ${i + 1}`} className="w-full rounded-2xl bg-black/30 px-3 py-2.5 text-[15px] outline-none placeholder:text-white/25" />
              </motion.div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={add} className="rounded-full bg-white/10 px-4 py-2 text-[13px]">add a line</button>
            <button onClick={fileIt} disabled={busy || !body.trim()} className="rounded-full bg-white px-4 py-2 text-[13px] font-medium text-black disabled:opacity-50">{busy ? 'filing…' : 'file the list'}</button>
          </div>
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
