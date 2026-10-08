import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from './Router';

const SB_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SB_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type Witness = {
  id: string;
  file_name: string;
  sha256: string;
  size: number;
  note: string | null;
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

async function sha256(file: File) {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function pretty(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / 1024 / 1024).toFixed(1) + ' MB';
  return (n / 1024 / 1024 / 1024).toFixed(2) + ' GB';
}

export default function WitnessPage() {
  const { shareId } = useRouter();
  const [rows, setRows] = useState<Witness[]>([]);
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [match, setMatch] = useState<string | null>(null);
  const focus = useMemo(() => rows.find((r) => r.id === shareId) || null, [rows, shareId]);

  async function load() {
    const res = await fetch(
      `${SB_URL}/rest/v1/witnesses?select=*&order=created_at.desc&limit=24`,
      { headers: headers() },
    );
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data)) setRows(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function stamp(file: File) {
    setBusy(true);
    setErr(null);
    setMatch(null);
    setWarn(file.size > 40 * 1024 * 1024 ? 'large file. hashing in the tab may feel slow. nothing is refused.' : null);
    try {
      const hash = await sha256(file);
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const row = {
        id,
        file_name: file.name || 'file',
        sha256: hash,
        size: file.size,
        note: note.trim() || null,
        author: author.trim() || null,
      };
      const res = await fetch(`${SB_URL}/rest/v1/witnesses`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(row),
      });
      if (!res.ok) throw new Error((await res.text()).slice(0, 180));
      setNote('');
      await load();
      history.pushState({}, '', '/witness/' + id);
      window.dispatchEvent(new PopStateEvent('popstate'));
    } catch (e: any) {
      setErr(e?.message || 'could not stamp the witness');
    } finally {
      setBusy(false);
    }
  }

  async function verify(file: File) {
    setBusy(true);
    setErr(null);
    setWarn(file.size > 40 * 1024 * 1024 ? 'large file. hashing in the tab may feel slow. nothing is refused.' : null);
    try {
      const hash = await sha256(file);
      const hit = rows.find((r) => r.sha256 === hash);
      if (focus && focus.sha256 === hash) setMatch('matches the open witness. same bytes.');
      else if (hit) setMatch('matches ' + hit.file_name + ' (' + hit.id + ').');
      else setMatch('no stored witness matches this file.');
    } catch (e: any) {
      setErr(e?.message || 'could not read the file');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-5 py-10">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
        <p className="text-xs tracking-[0.22em] uppercase text-neutral-500 mb-2">witness</p>
        <h1 className="text-3xl font-semibold text-white tracking-tight">stamp a file without keeping it</h1>
        <p className="text-neutral-400 mt-3 leading-relaxed">
          The bytes stay on this machine. Only the name, size, and SHA-256 land in the witnesses table.
          Later you can drop the same file and see if it still matches. Not a cabinet.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-4 mt-8">
        <label className="glass rounded-3xl p-5 block cursor-pointer">
          <span className="text-sm text-white font-medium">stamp</span>
          <input className="mt-3 w-full bg-transparent text-sm text-neutral-300 outline-none" placeholder="note, optional" value={note} onChange={(e) => setNote(e.target.value)} />
          <input className="mt-2 w-full bg-transparent text-sm text-neutral-300 outline-none" placeholder="your name, optional" value={author} onChange={(e) => setAuthor(e.target.value)} />
          <input className="mt-4 block w-full text-sm text-neutral-400" type="file" disabled={busy} onChange={(e) => e.target.files?.[0] && stamp(e.target.files[0])} />
          <p className="text-xs text-neutral-500 mt-3">no size cap. a large file only warns that hashing may feel slow.</p>
        </label>
        <label className="glass rounded-3xl p-5 block cursor-pointer">
          <span className="text-sm text-white font-medium">check a file against the book</span>
          <input className="mt-4 block w-full text-sm text-neutral-400" type="file" disabled={busy} onChange={(e) => e.target.files?.[0] && verify(e.target.files[0])} />
          {match && <p className="text-sm text-sky-300 mt-4">{match}</p>}
        </label>
      </div>

      {warn && <p className="text-sm text-amber-300/90 mt-4">{warn}</p>}
      {err && <p className="text-sm text-rose-300 mt-4">{err}</p>}

      {focus && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-3xl p-5 mt-6">
          <p className="text-white font-medium">{focus.file_name}</p>
          <p className="text-xs text-neutral-500 mt-1 break-all">{focus.sha256}</p>
          <p className="text-sm text-neutral-400 mt-2">{pretty(Number(focus.size))}{focus.note ? ' · ' + focus.note : ''}</p>
          <button className="text-xs text-sky-400 mt-3" onClick={() => navigator.clipboard.writeText(location.origin + '/witness/' + focus.id)}>copy discord link</button>
        </motion.div>
      )}

      <ul className="mt-8 space-y-3">
        {rows.map((row) => (
          <li key={row.id}>
            <a href={'/witness/' + row.id} className="glass rounded-2xl px-4 py-3 flex items-center justify-between gap-3 hover:-translate-y-0.5 transition-transform">
              <span>
                <span className="text-white text-sm">{row.file_name}</span>
                <span className="block text-xs text-neutral-500">{pretty(Number(row.size))} · {row.sha256.slice(0, 12)}</span>
              </span>
              <span className="text-xs text-neutral-500">{new Date(row.created_at).toLocaleDateString()}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
