import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { db, prettySize } from '../lib/db';
import { publishLocalFile } from '../lib/cloudShare';
import { useRouter } from './Router';

type ListRow = {
  id: string;
  title: string;
  items: string[];
  share_id: string | null;
  author: string | null;
  created_at: string;
};

function listId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export default function CopingPage() {
  const { shareId } = useRouter();
  const [title, setTitle] = useState('');
  const [lines, setLines] = useState('');
  const [author, setAuthor] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ListRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');
  const [copied, setCopied] = useState('');
  const [done, setDone] = useState<Record<string, boolean>>({});

  async function load() {
    const res = await fetch(
      `${db.url}/rest/v1/coping_lists?select=id,title,items,share_id,author,created_at&order=created_at.desc&limit=16`,
      { headers: { apikey: db.key, Authorization: `Bearer ${db.key}` } },
    );
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data)) setRows(data.map((row) => ({ ...row, items: Array.isArray(row.items) ? row.items : [] })));
  }

  useEffect(() => {
    load().catch(() => setErr('the list table did not answer'));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const items = lines.split('\n').map((line) => line.trim()).filter(Boolean).slice(0, 24);
    if (!title.trim() || !items.length) return;
    setBusy(true);
    setErr('');
    setWarn(file && file.size > 12 * 1024 * 1024 ? 'the attached file is heavy. the tab may feel slow. nothing is refused.' : '');
    let share_id: string | null = null;
    if (file) {
      const sent = await publishLocalFile(file, { caption: title.trim(), author, cardTitle: file.name });
      if (!sent.ok || !sent.id) {
        setBusy(false);
        setErr(sent.error || 'the share table did not take the file');
        return;
      }
      share_id = sent.id;
      if (sent.warn) setWarn(sent.warn);
    }
    const id = listId();
    const res = await fetch(`${db.url}/rest/v1/coping_lists`, {
      method: 'POST',
      headers: {
        apikey: db.key,
        Authorization: `Bearer ${db.key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({ id, title: title.trim(), items, share_id, author: author.trim() || null }),
    });
    setBusy(false);
    if (!res.ok) {
      setErr('could not file the list');
      return;
    }
    setTitle('');
    setLines('');
    setFile(null);
    await load();
  }

  async function copy(id: string) {
    await navigator.clipboard.writeText(`${location.origin}/coping/${id}`);
    setCopied(id);
    setTimeout(() => setCopied(''), 1400);
  }

  const focus = shareId ? rows.find((r) => r.id === shareId) : null;

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pt-28 pb-24">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="text-xs tracking-[0.22em] uppercase text-[#bf5af2]">coping</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06, duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="mt-3 text-4xl font-semibold tracking-tight">a list beside a file</motion.h1>
        <p className="mt-3 text-neutral-400 max-w-xl">Checks live on the page, not in a vault. An optional local file still lands in the share table. Paste /coping in Discord for the card.</p>
        {focus && (
          <motion.article initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 glass rounded-3xl p-5">
            <p className="text-xs text-neutral-500">opened from a card</p>
            <h2 className="mt-1 text-xl">{focus.title}</h2>
            <ul className="mt-3 space-y-2">
              {focus.items.map((item) => (
                <li key={item} className="text-sm text-neutral-200">{item}</li>
              ))}
            </ul>
            {focus.share_id && <a className="mt-3 inline-block text-sm text-[#64b5ff]" href={`/s/${focus.share_id}`}>open the attached file</a>}
          </motion.article>
        )}
        <form onSubmit={save} className="mt-8 glass rounded-[28px] p-5 space-y-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="list title" className="w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#bf5af2]/60" />
          <textarea value={lines} onChange={(e) => setLines(e.target.value)} placeholder="one step per line" rows={6} className="w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#bf5af2]/60" />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="from, optional" className="w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#bf5af2]/60" />
          <label className="block rounded-2xl border border-dashed border-white/15 bg-black/30 px-4 py-6 text-center cursor-pointer">
            <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <span className="text-sm">{file ? file.name : 'optional file from this computer'}</span>
            <span className="block text-xs text-neutral-500 mt-1">{file ? prettySize(file.size) : 'any size, warned if slow'}</span>
          </label>
          {warn && <p className="text-sm text-amber-200/90">{warn}</p>}
          {err && <p className="text-sm text-rose-300">{err}</p>}
          <button disabled={busy || !title.trim() || !lines.trim()} className="rounded-full bg-white text-black px-5 py-2.5 text-sm font-medium disabled:opacity-40">{busy ? 'filing…' : 'file the list'}</button>
        </form>
        <ul className="mt-8 space-y-3">
          {rows.map((row, i) => (
            <motion.li key={row.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.04, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-3xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-neutral-100">{row.title}</p>
                  <ul className="mt-2 space-y-1">
                    {row.items.slice(0, 6).map((item) => {
                      const key = row.id + item;
                      return (
                        <li key={item}>
                          <button type="button" onClick={() => setDone((prev) => ({ ...prev, [key]: !prev[key] }))} className={`text-xs ${done[key] ? 'text-neutral-600 line-through' : 'text-neutral-400'}`}>{item}</button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
                <button onClick={() => copy(row.id)} className="shrink-0 text-xs rounded-full border border-white/10 px-3 py-1.5">{copied === row.id ? 'copied' : 'card link'}</button>
              </div>
            </motion.li>
          ))}
        </ul>
      </main>
    </div>
  );
}
