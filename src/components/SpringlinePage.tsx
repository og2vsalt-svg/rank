import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { db, prettySize } from '../lib/db';
import { publishLocalFile } from '../lib/cloudShare';
import { useRouter } from './Router';

type Slip = {
  id: string;
  note: string;
  hold_until: string | null;
  share_id: string | null;
  author: string | null;
  created_at: string;
};

function slipId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function holdLabel(iso: string | null) {
  if (!iso) return 'open now';
  const t = +new Date(iso);
  if (Number.isNaN(t)) return 'open now';
  if (t > Date.now()) return 'holds until ' + new Date(iso).toLocaleString();
  return 'released ' + new Date(iso).toLocaleString();
}

export default function SpringlinePage() {
  const { shareId } = useRouter();
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [hold, setHold] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<Slip[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');
  const [copied, setCopied] = useState('');

  const focus = useMemo(() => rows.find((row) => row.id === shareId) || null, [rows, shareId]);

  async function load() {
    const res = await fetch(
      `${db.url}/rest/v1/springline_slips?select=id,note,hold_until,share_id,author,created_at&order=created_at.desc&limit=16`,
      { headers: { apikey: db.key, Authorization: `Bearer ${db.key}` } },
    );
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data)) setRows(data);
  }

  useEffect(() => {
    load().catch(() => setErr('the slip table did not answer'));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    setBusy(true);
    setErr('');
    setWarn(file && file.size > 12 * 1024 * 1024 ? 'that file is heavy. the tab may feel slow while it sends. nothing is refused.' : '');
    let share_id: string | null = null;
    if (file) {
      const sent = await publishLocalFile(file, { caption: note.trim(), author, cardTitle: file.name });
      if (!sent.ok || !sent.id) {
        setBusy(false);
        setErr(sent.error || 'the share table did not take the file');
        return;
      }
      share_id = sent.id;
      if (sent.warn) setWarn(sent.warn);
    }
    const id = slipId();
    const res = await fetch(`${db.url}/rest/v1/springline_slips`, {
      method: 'POST',
      headers: {
        apikey: db.key,
        Authorization: `Bearer ${db.key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        id,
        note: note.trim(),
        hold_until: hold ? new Date(hold).toISOString() : null,
        share_id,
        author: author.trim() || null,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      setErr('could not file the slip');
      return;
    }
    setNote('');
    setHold('');
    setFile(null);
    await load();
  }

  async function copy(id: string) {
    const url = `${location.origin}/springline/${id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(id);
    } catch {
      setErr('could not copy the link');
    }
  }

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pt-28 pb-24">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="text-xs tracking-[0.22em] uppercase text-[#64d2ff]">springline</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06, duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="mt-3 text-4xl font-semibold tracking-tight">a line that holds, then lets go</motion.h1>
        <p className="mt-3 text-neutral-400 max-w-xl">Write a short hold note. An optional file from this computer lands in the share table, not a vault drawer. Paste /springline in Discord for the card. Large drops are warned, never refused.</p>
        {focus && (
          <motion.article initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 glass rounded-3xl p-5">
            <p className="text-xs text-neutral-500">opened from a card</p>
            <h2 className="mt-1 text-xl">{focus.note}</h2>
            <p className="mt-2 text-sm text-neutral-400">{holdLabel(focus.hold_until)}{focus.author ? ` \u00b7 ${focus.author}` : ''}</p>
            {focus.share_id && <a className="mt-3 inline-block text-sm text-[#64b5ff]" href={`/s/${focus.share_id}`}>open the attached file</a>}
          </motion.article>
        )}
        <form onSubmit={save} className="mt-8 glass rounded-[28px] p-5 space-y-3">
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="what should wait on the line" rows={4} maxLength={400} className="w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#64d2ff]/60" />
          <label className="block text-xs text-neutral-500">
            hold until, optional
            <input type="datetime-local" value={hold} onChange={(e) => setHold(e.target.value)} className="mt-1 w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#64d2ff]/60" />
          </label>
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="from, optional" className="w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#64d2ff]/60" />
          <label className="block rounded-2xl border border-dashed border-white/15 bg-black/30 px-4 py-6 text-center cursor-pointer">
            <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <span className="text-sm">{file ? file.name : 'optional file from this computer'}</span>
            <span className="block text-xs text-neutral-500 mt-1">{file ? prettySize(file.size) : 'any size, warned if slow'}</span>
          </label>
          {warn && <p className="text-sm text-amber-200/90">{warn}</p>}
          {err && <p className="text-sm text-rose-300">{err}</p>}
          <button type="submit" disabled={busy || !note.trim()} className="rounded-full bg-white text-black px-5 py-2.5 text-sm font-medium disabled:opacity-50">{busy ? 'sending\u2026' : 'leave the slip'}</button>
        </form>
        <section className="mt-10 space-y-3">
          {rows.map((row, i) => (
            <motion.article key={row.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-3xl p-5">
              <p className="text-sm text-white">{row.note}</p>
              <p className="mt-2 text-xs text-neutral-500">{holdLabel(row.hold_until)}{row.author ? ` \u00b7 ${row.author}` : ''}</p>
              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                <button type="button" onClick={() => copy(row.id)} className="text-[#64d2ff]">{copied === row.id ? 'copied' : 'copy /springline link'}</button>
                {row.share_id && <a className="text-[#64b5ff]" href={`/s/${row.share_id}`}>file</a>}
              </div>
            </motion.article>
          ))}
        </section>
      </main>
    </div>
  );
}
