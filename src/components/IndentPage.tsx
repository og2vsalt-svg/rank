import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from './Router';
import { publishLocalFile } from '../lib/cloudShare';

const SB_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SB_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type Indent = {
  id: string;
  title: string;
  note: string | null;
  status: string;
  fulfilled_share_id: string | null;
  fulfilled_name: string | null;
  author: string | null;
  created_at: string;
};

function headers() {
  return {
    apikey: SB_KEY,
    Authorization: `Bearer ${SB_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };
}

export default function IndentPage() {
  const { shareId } = useRouter();
  const [rows, setRows] = useState<Indent[]>([]);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const focus = useMemo(() => rows.find((r) => r.id === shareId) || null, [rows, shareId]);

  async function load() {
    const res = await fetch(`${SB_URL}/rest/v1/indents?select=*&order=created_at.desc&limit=30`, { headers: headers() });
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data)) setRows(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function ask() {
    if (!title.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const res = await fetch(`${SB_URL}/rest/v1/indents`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ id, title: title.trim(), note: note.trim() || null, author: author.trim() || null, status: 'open' }),
      });
      if (!res.ok) throw new Error((await res.text()).slice(0, 180));
      setTitle('');
      setNote('');
      await load();
      history.pushState({}, '', '/indent/' + id);
      window.dispatchEvent(new PopStateEvent('popstate'));
    } catch (e: any) {
      setErr(e?.message || 'could not open the indent');
    } finally {
      setBusy(false);
    }
  }

  async function fulfill(file: File, row: Indent) {
    setBusy(true);
    setErr(null);
    setWarn(file.size > 40 * 1024 * 1024 ? 'large drop. the browser may feel slow while it sends. nothing is refused.' : null);
    const published = await publishLocalFile(file, {
      caption: row.title,
      author: author.trim() || undefined,
      cardTitle: file.name,
    });
    if (!published.ok || !published.id) {
      setErr(published.error || 'upload failed');
      setBusy(false);
      return;
    }
    const res = await fetch(`${SB_URL}/rest/v1/indents?id=eq.${encodeURIComponent(row.id)}`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify({ status: 'filled', fulfilled_share_id: published.id, fulfilled_name: file.name }),
    });
    if (!res.ok) setErr((await res.text()).slice(0, 180));
    await load();
    setBusy(false);
  }

  return (
    <div className="max-w-3xl mx-auto px-5 py-10">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
        <p className="text-xs tracking-[0.22em] uppercase text-neutral-500 mb-2">indent</p>
        <h1 className="text-3xl font-semibold text-white tracking-tight">ask for a file, then someone fills it</h1>
        <p className="text-neutral-400 mt-3 leading-relaxed">
          An indent is a request, not a drawer. When someone answers, their local file is uploaded into the share table and linked here.
          Discord unfurls /indent/id. Large drops are warned, never refused.
        </p>
      </motion.div>

      <div className="glass rounded-3xl p-5 mt-8">
        <input className="w-full bg-transparent text-white text-lg outline-none placeholder:text-neutral-600" placeholder="what do you need?" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea className="w-full bg-transparent text-sm text-neutral-300 outline-none mt-3 min-h-16 placeholder:text-neutral-600" placeholder="a short note" value={note} onChange={(e) => setNote(e.target.value)} />
        <div className="flex items-center justify-between gap-3 mt-3">
          <input className="bg-transparent text-sm text-neutral-400 outline-none" placeholder="your name" value={author} onChange={(e) => setAuthor(e.target.value)} />
          <button disabled={busy || !title.trim()} onClick={ask} className="rounded-full bg-white text-black text-sm px-4 py-2 disabled:opacity-40">open indent</button>
        </div>
      </div>

      {warn && <p className="text-sm text-amber-300/90 mt-4">{warn}</p>}
      {err && <p className="text-sm text-rose-300 mt-4">{err}</p>}

      {focus && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-3xl p-5 mt-6">
          <p className="text-white font-medium">{focus.title}</p>
          <p className="text-sm text-neutral-400 mt-1">{focus.note}</p>
          <p className="text-xs text-neutral-500 mt-2">{focus.status}{focus.author ? ' · ' + focus.author : ''}</p>
          {focus.fulfilled_share_id ? (
            <a className="text-sm text-sky-400 mt-3 inline-block" href={'/s/' + focus.fulfilled_share_id}>open {focus.fulfilled_name || 'the file'}</a>
          ) : (
            <label className="block mt-4 text-sm text-neutral-300">
              fill this indent with a local file
              <input className="mt-2 block w-full text-sm text-neutral-400" type="file" disabled={busy} onChange={(e) => e.target.files?.[0] && fulfill(e.target.files[0], focus)} />
            </label>
          )}
          <button className="text-xs text-sky-400 mt-3 block" onClick={() => navigator.clipboard.writeText(location.origin + '/indent/' + focus.id)}>copy discord link</button>
        </motion.div>
      )}

      <ul className="mt-8 space-y-3">
        {rows.map((row) => (
          <li key={row.id}>
            <a href={'/indent/' + row.id} className="glass rounded-2xl px-4 py-3 flex items-center justify-between gap-3 hover:-translate-y-0.5 transition-transform">
              <span>
                <span className="text-white text-sm">{row.title}</span>
                <span className="block text-xs text-neutral-500">{row.status}{row.fulfilled_name ? ' · ' + row.fulfilled_name : ''}</span>
              </span>
              <span className="text-xs text-neutral-500">{new Date(row.created_at).toLocaleDateString()}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
