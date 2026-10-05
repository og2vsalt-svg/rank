import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { db, prettySize } from '../lib/db';
import { publishLocalFile } from '../lib/cloudShare';
import { useRouter } from './Router';

type Slip = {
  id: string;
  to_name: string;
  note: string;
  share_id: string | null;
  file_name: string | null;
  author: string | null;
  created_at: string;
};

function slipId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export default function TrundlePage() {
  const { shareId } = useRouter();
  const [toName, setToName] = useState('');
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<Slip[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');
  const [copied, setCopied] = useState('');

  async function load() {
    const res = await fetch(
      `${db.url}/rest/v1/trundle_slips?select=id,to_name,note,share_id,file_name,author,created_at&order=created_at.desc&limit=18`,
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
    if (!toName.trim() || !note.trim() || !file) return;
    setBusy(true);
    setErr('');
    setWarn(file.size > 12 * 1024 * 1024 ? 'this parcel is heavy. the tab may feel slow. nothing is refused.' : '');
    const sent = await publishLocalFile(file, {
      caption: note.trim(),
      author,
      cardTitle: file.name,
    });
    if (!sent.ok || !sent.id) {
      setBusy(false);
      setErr(sent.error || 'the share table did not take the file');
      return;
    }
    if (sent.warn) setWarn(sent.warn);
    const id = slipId();
    const res = await fetch(`${db.url}/rest/v1/trundle_slips`, {
      method: 'POST',
      headers: {
        apikey: db.key,
        Authorization: `Bearer ${db.key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        id,
        to_name: toName.trim(),
        note: note.trim(),
        share_id: sent.id,
        file_name: file.name,
        author: author.trim() || null,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      setErr('the file landed, but the slip row did not');
      return;
    }
    setToName('');
    setNote('');
    setFile(null);
    await load();
  }

  async function copy(id: string) {
    await navigator.clipboard.writeText(`${location.origin}/trundle/${id}`);
    setCopied(id);
    setTimeout(() => setCopied(''), 1400);
  }

  const focus = shareId ? rows.find((r) => r.id === shareId) : null;

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pt-28 pb-24">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="text-xs tracking-[0.22em] uppercase text-[#64d2ff]">trundle</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06, duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="mt-3 text-4xl font-semibold tracking-tight">a slip for someone else</motion.h1>
        <p className="mt-3 text-neutral-400 max-w-xl">Not a drawer. Name who it is for, write the handoff, and the local file goes into the share table. Paste /trundle in Discord for the card. Large files are warned, never refused.</p>
        {focus && (
          <motion.article initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 glass rounded-3xl p-5">
            <p className="text-xs text-neutral-500">for {focus.to_name}</p>
            <h2 className="mt-1 text-xl">{focus.file_name || 'parcel'}</h2>
            <p className="mt-2 text-sm text-neutral-300 whitespace-pre-wrap">{focus.note}</p>
            {focus.share_id && <a className="mt-3 inline-block text-sm text-[#64b5ff]" href={`/s/${focus.share_id}`}>open the file</a>}
          </motion.article>
        )}
        <form onSubmit={save} className="mt-8 glass rounded-[28px] p-5 space-y-3">
          <input value={toName} onChange={(e) => setToName(e.target.value)} placeholder="for" className="w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#64d2ff]/60" />
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="what they should do with it" rows={4} className="w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#64d2ff]/60" />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="from, optional" className="w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#64d2ff]/60" />
          <label className="block rounded-2xl border border-dashed border-white/15 bg-black/30 px-4 py-6 text-center cursor-pointer">
            <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <span className="text-sm">{file ? file.name : 'file from this computer'}</span>
            <span className="block text-xs text-neutral-500 mt-1">{file ? prettySize(file.size) : 'any size, warned if slow'}</span>
          </label>
          {warn && <p className="text-sm text-amber-200/90">{warn}</p>}
          {err && <p className="text-sm text-rose-300">{err}</p>}
          <button disabled={busy || !toName.trim() || !note.trim() || !file} className="rounded-full bg-white text-black px-5 py-2.5 text-sm font-medium disabled:opacity-40">{busy ? 'sending…' : 'file the slip'}</button>
        </form>
        <ul className="mt-8 space-y-3">
          {rows.map((row, i) => (
            <motion.li key={row.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.04, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-3xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-neutral-100">for {row.to_name}</p>
                  <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{row.note}</p>
                  {row.share_id && <a className="text-xs text-[#64b5ff]" href={`/s/${row.share_id}`}>{row.file_name || 'file'}</a>}
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
