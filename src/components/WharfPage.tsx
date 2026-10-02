import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

const SB_URL = (
  (import.meta as any).env?.VITE_SUPABASE_URL || 'https://tqfocdktvjuwoiyfgesb.supabase.co'
).replace(/\/$/, '');
const SB_KEY =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

export default function WharfPage() {
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [embed, setEmbed] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const send = async () => {
    const target = url.trim();
    if (!/^https?:\/\//i.test(target)) {
      setError('needs a full http link');
      return;
    }
    setBusy(true);
    setError('');
    const card = `wharf\n${target}\n${note.trim()}\n`;
    const file = new File([card], 'wharf.txt', { type: 'text/plain' });
    const res = await publishLocalFile(file, { caption: note.trim().slice(0, 160) || target, color: '#30D158' });
    if (!res.ok || !res.id) {
      setBusy(false);
      setError(res.error || 'the link did not tie');
      return;
    }
    await fetch(`${SB_URL}/rest/v1/links`, {
      method: 'POST',
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ url: target, note: note.trim() || null, author: 'wharf' }),
    }).catch(() => null);
    setBusy(false);
    setEmbed(res.embed || '');
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] uppercase tracking-[0.16em] text-white/45">wharf</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">tie a link to the quay</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">
            A URL is saved on the links table and also filed as a small text drop so Discord can unfurl a proper card. Paste the /s link, not the raw hash.
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="glass mt-8 rounded-3xl p-5">
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" className="w-full rounded-2xl bg-black/30 px-4 py-3 text-[15px] outline-none placeholder:text-white/30" />
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="why it is here" className="mt-3 w-full rounded-2xl bg-black/30 px-4 py-3 text-[15px] outline-none placeholder:text-white/30" />
          <button onClick={send} disabled={busy || !url.trim()} className="mt-4 rounded-full bg-white px-5 py-2.5 text-[14px] font-medium text-black disabled:opacity-50">{busy ? 'tying…' : 'tie the link'}</button>
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
