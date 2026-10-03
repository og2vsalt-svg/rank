import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import Navbar from './Navbar';
import { useRouter } from './Router';

const ease = [0.22, 1, 0.36, 1] as const;

type Ask = {
  id: string;
  title: string;
  note: string | null;
  author: string | null;
  fulfilled_share_id: string | null;
  created_at: string;
};

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function BobstayPage() {
  const { shareId } = useRouter();
  const [asks, setAsks] = useState<Ask[]>([]);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('ask for a file, or answer one by uploading from this machine. the answer lands in the share table.');
  const [card, setCard] = useState('');

  const slow = useMemo(() => (file && file.size > 12 * 1024 * 1024 ? `${pretty(file.size)}. preview clients may feel slow. the desk still files it.` : ''), [file]);

  async function load() {
    const r = await fetch('/api/requests');
    const data = await r.json();
    if (r.ok) setAsks(Array.isArray(data.requests) ? data.requests : []);
  }

  useEffect(() => {
    load().catch(() => setStatus('the request board did not answer'));
  }, []);

  async function ask() {
    if (!title.trim()) return;
    setBusy(true);
    try {
      const r = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), note: note.trim(), author: author.trim() || 'bobstay' }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'the board did not take the ask');
      setCard(`${window.location.origin}/bobstay/${data.request.id}`);
      setTitle('');
      setNote('');
      setStatus('asked. paste the board link in Discord.');
      await load();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'ask failed');
    } finally {
      setBusy(false);
    }
  }

  async function answer(id: string) {
    if (!file) {
      setStatus('choose a local file first');
      return;
    }
    setBusy(true);
    setStatus('filing the answer');
    try {
      const body = new FormData();
      body.append('file', file, file.name);
      body.append('author', author.trim() || 'bobstay');
      body.append('caption', `answer for ${id}`);
      body.append('cardTitle', file.name);
      const up = await fetch('/api/share', { method: 'POST', body });
      const uploaded = await up.json();
      if (!up.ok) throw new Error(uploaded.error || 'the share table did not take the file');
      const r = await fetch('/api/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, fulfilledShareId: uploaded.id }),
      });
      if (!r.ok) throw new Error('the board did not mark the answer');
      setCard(`${window.location.origin}/s/${uploaded.id}`);
      setStatus('answered. the file card is ready for Discord.');
      await load();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'answer failed');
    } finally {
      setBusy(false);
    }
  }

  const focus = shareId ? asks.find((a) => a.id === shareId) : null;

  return (
    <div className="mesh min-h-screen text-white">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-28 pb-24">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease }} className="text-[#0a84ff] text-[13px] tracking-wide">request board</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }} className="mt-3 text-4xl sm:text-5xl font-semibold tracking-tight">bobstay</motion.h1>
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.05, ease }} className="mt-4 text-neutral-400 text-lg max-w-xl leading-relaxed">
          Ask for a file. Someone else can answer from their machine. The answer is a real share row, not a drawer in the vault.
        </motion.p>

        <div className="mt-8 space-y-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="what do you need" className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-white/25" />
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="a little context" className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-white/25 resize-none" />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="your name" className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-white/25" />
          <button disabled={!title.trim() || busy} onClick={ask} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40 active:scale-[0.98] transition-transform">post the ask</button>
        </div>

        <label className="mt-6 block rounded-3xl border border-white/10 bg-white/[0.04] p-4 cursor-pointer hover:bg-white/[0.06] transition-colors">
          <span className="text-xs text-neutral-500">answer file</span>
          <span className="mt-2 block text-sm truncate">{file ? file.name : 'choose a local file to answer an ask'}</span>
          <span className="mt-1 block text-xs text-neutral-500">{file ? pretty(file.size) : 'no size cutoff'}</span>
          <input type="file" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </label>
        {slow && <p className="mt-3 text-sm text-amber-200/80">{slow}</p>}
        {card && <a href={card} className="mt-4 block break-all text-[#0a84ff] text-sm">{card}</a>}
        <p className="mt-4 text-sm text-neutral-400">{status}</p>

        <div className="mt-8 space-y-2">
          {(focus ? [focus, ...asks.filter((a) => a.id !== focus.id)] : asks).map((ask) => (
            <motion.article key={ask.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-white">{ask.title}</p>
              {ask.note && <p className="mt-1 text-sm text-neutral-400">{ask.note}</p>}
              <p className="mt-2 text-xs text-neutral-500">{ask.author || 'bobstay'} · {new Date(ask.created_at).toLocaleString()}</p>
              {ask.fulfilled_share_id ? (
                <a className="mt-3 inline-block text-sm text-[#0a84ff]" href={`${window.location.origin}/s/${ask.fulfilled_share_id}`}>answered · /s/{ask.fulfilled_share_id}</a>
              ) : (
                <button disabled={busy} onClick={() => answer(ask.id)} className="mt-3 text-sm text-neutral-200 underline underline-offset-4">answer with the chosen file</button>
              )}
            </motion.article>
          ))}
          {!asks.length && <p className="text-sm text-neutral-500">the board is empty.</p>}
        </div>
      </main>
    </div>
  );
}
