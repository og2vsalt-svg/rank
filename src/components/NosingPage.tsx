import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { db, prettySize } from '../lib/db';
import { publishLocalFile } from '../lib/cloudShare';
import { useRouter } from './Router';

type Slip = {
  id: string;
  title: string;
  due_note: string | null;
  share_id: string | null;
  file_name: string | null;
  author: string | null;
  created_at: string;
};

export default function NosingPage() {
  const { shareId } = useRouter();
  const [title, setTitle] = useState('');
  const [due, setDue] = useState('');
  const [author, setAuthor] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<Slip[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');
  const [copied, setCopied] = useState('');

  async function load() {
    const res = await fetch(
      `${db.url}/rest/v1/nosing_slips?select=id,title,due_note,share_id,file_name,author,created_at&order=created_at.desc&limit=16`,
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
    if (!file || !title.trim()) return;
    setBusy(true);
    setErr('');
    setWarn(file.size > 12 * 1024 * 1024 ? 'this one is heavy. the tab may feel slow while it sends. nothing is refused.' : '');
    const sent = await publishLocalFile(file, { caption: due.trim() || title.trim(), author, cardTitle: file.name });
    if (!sent.ok || !sent.id) {
      setBusy(false);
      setErr(sent.error || 'the share table did not take the file');
      return;
    }
    if (sent.warn) setWarn(sent.warn);
    const res = await fetch(`${db.url}/rest/v1/nosing_slips`, {
      method: 'POST',
      headers: {
        apikey: db.key,
        Authorization: `Bearer ${db.key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        title: title.trim(),
        due_note: due.trim() || null,
        share_id: sent.id,
        file_name: file.name,
        author: author.trim() || null,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      setErr('the file landed, but the slip did not');
      return;
    }
    setTitle('');
    setDue('');
    setFile(null);
    await load();
  }

  async function copy(id: string) {
    await navigator.clipboard.writeText(`${location.origin}/nosing/${id}`);
    setCopied(id);
    setTimeout(() => setCopied(''), 1400);
  }

  const focus = shareId ? rows.find((r) => r.id === shareId) : null;

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pt-28 pb-24">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-xs tracking-[0.22em] uppercase text-[#64d2ff]">nosing</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="mt-3 text-4xl font-semibold tracking-tight">a due slip on the edge of a file</motion.h1>
        <p className="mt-3 text-neutral-400 max-w-xl">Name what is expected back, then hand a local file to the share table. The slip lives in its own table. No size cap. Paste /nosing in Discord for a card.</p>
        {focus && (
          <motion.article initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 glass rounded-3xl p-5">
            <p className="text-xs text-neutral-500">opened from a card</p>
            <h2 className="mt-1 text-xl">{focus.title}</h2>
            <p className="mt-2 text-sm text-neutral-300">{focus.due_note || 'no due note'}</p>
            {focus.share_id && <a className="mt-3 inline-block text-sm text-[#64b5ff]" href={`/s/${focus.share_id}`}>open {focus.file_name || 'the file'}</a>}
          </motion.article>
        )}
        <form onSubmit={save} className="mt-8 glass rounded-[28px] p-5 space-y-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="what this handoff is" className="w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#64d2ff]/60" />
          <input value={due} onChange={(e) => setDue(e.target.value)} placeholder="expected back, in words" className="w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#64d2ff]/60" />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="from" className="w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#64d2ff]/60" />
          <label className="block rounded-2xl border border-dashed border-white/15 bg-black/30 px-4 py-8 text-center cursor-pointer">
            <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <span className="text-sm">{file ? file.name : 'Choose a file from this computer'}</span>
            <span className="block text-xs text-neutral-500 mt-1">{file ? prettySize(file.size) : 'any type'}</span>
          </label>
          {warn && <p className="text-sm text-amber-200/90">{warn}</p>}
          {err && <p className="text-sm text-rose-300">{err}</p>}
          <button disabled={busy || !file || !title.trim()} className="rounded-full bg-[#64d2ff] text-black px-5 py-2.5 text-sm font-medium disabled:opacity-40">{busy ? 'sending…' : 'file the slip'}</button>
        </form>
        <ul className="mt-8 space-y-3">
          {rows.map((row, i) => (
            <motion.li key={row.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.04 }} className="glass rounded-3xl p-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm truncate">{row.title}</p>
                <p className="text-xs text-neutral-500 mt-1 truncate">{row.due_note || row.file_name || 'slip'}</p>
              </div>
              <button onClick={() => copy(row.id)} className="shrink-0 text-xs rounded-full border border-white/10 px-3 py-1.5">{copied === row.id ? 'copied' : 'card link'}</button>
            </motion.li>
          ))}
        </ul>
      </main>
    </div>
  );
}
