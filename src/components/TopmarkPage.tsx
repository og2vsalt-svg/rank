import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

const SB_URL = (
  (import.meta as any).env?.VITE_SUPABASE_URL ||
  'https://tqfocdktvjuwoiyfgesb.supabase.co'
).replace(/\/$/, '');
const SB_KEY =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

function pretty(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return Math.max(1, Math.round(n / 1024)) + ' KB';
  return (n / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function TopmarkPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [warn, setWarn] = useState<string | null>(null);
  const [card, setCard] = useState('');
  const [rows, setRows] = useState<{ name: string; embed: string }[]>([]);
  const [copied, setCopied] = useState(false);

  const total = useMemo(() => files.reduce((n, f) => n + f.size, 0), [files]);

  const send = async () => {
    if (!files.length || !title.trim()) return;
    setBusy(true);
    setError('');
    setCopied(false);
    setRows([]);
    const landed: { name: string; id: string; embed: string }[] = [];
    for (const file of files) {
      const res = await publishLocalFile(file, {
        caption: title.trim().slice(0, 140),
        author: author.trim() || undefined,
      });
      if (!res.ok || !res.id) {
        setBusy(false);
        setError(res.error || `${file.name} did not land`);
        return;
      }
      landed.push({ name: file.name, id: res.id, embed: res.embed || '' });
    }
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    const lines = [
      `# ${title.trim()}`,
      note.trim(),
      '',
      ...landed.map((row, i) => `${i + 1}. ${row.name} — ${row.embed}`),
    ].filter(Boolean).join('\n');
    const indexFile = new File([lines], `${title.trim().slice(0, 40).replace(/\s+/g, '-') || 'pack'}.md`, { type: 'text/markdown' });
    const index = await publishLocalFile(indexFile, {
      caption: note.trim().slice(0, 180) || `${landed.length} files in ${title.trim()}`,
      author: author.trim() || undefined,
    });
    if (!index.ok || !index.id) {
      setBusy(false);
      setError(index.error || 'the pack note did not land');
      setRows(landed);
      return;
    }
    await fetch(`${SB_URL}/rest/v1/bundles`, {
      method: 'POST',
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        id,
        title: title.trim().slice(0, 140),
        note: note.trim().slice(0, 500) || null,
        author: author.trim() || null,
        share_ids: landed.map((r) => r.id),
        index_share_id: index.id,
      }),
    }).catch(() => null);
    setBusy(false);
    setWarn(total > 24 * 1024 * 1024 ? 'large pack. the browser may feel slow while it sends. nothing is refused.' : null);
    setRows(landed);
    setCard(index.embed || '');
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] uppercase tracking-[0.16em] text-white/45">topmark</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">one mark, several files</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">Each local file lands in the share table on its own. A short pack note is filed too, so Discord unfurls one card that names the set. Not a drawer — a mark on the water.</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.5 }} className="glass mt-8 rounded-3xl p-5">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-black/25 px-4 py-10 text-center transition hover:border-white/30">
            <span className="text-[15px] text-white">{files.length ? `${files.length} files` : 'choose files'}</span>
            <span className="mt-1 text-[13px] text-white/45">{files.length ? pretty(total) : 'as many as this machine will hand over'}</span>
            <input type="file" multiple className="sr-only" onChange={(e) => setFiles(Array.from(e.target.files || []))} />
          </label>
          {files.length > 0 && (
            <ul className="mt-3 space-y-1">
              {files.map((f) => (
                <li key={f.name + f.size} className="flex justify-between text-[13px] text-white/55">
                  <span className="truncate pr-3">{f.name}</span>
                  <span className="shrink-0">{pretty(f.size)}</span>
                </li>
              ))}
            </ul>
          )}
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="pack name" className="mt-3 w-full rounded-2xl bg-black/30 px-4 py-3 text-[15px] outline-none placeholder:text-white/30" />
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="a line for the card" rows={3} className="mt-3 w-full resize-none rounded-2xl bg-black/30 px-4 py-3 text-[15px] outline-none placeholder:text-white/30" />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="from" className="mt-3 w-full rounded-2xl bg-black/30 px-4 py-3 text-[15px] outline-none placeholder:text-white/30" />
          <button onClick={send} disabled={!files.length || !title.trim() || busy} className="mt-4 rounded-full bg-white px-5 py-2.5 text-[14px] font-medium text-black transition hover:bg-neutral-200 disabled:opacity-50">{busy ? 'marking…' : 'set the mark'}</button>
          {warn && <p className="mt-3 text-[13px] text-amber-200/80">{warn}</p>}
          {error && <p className="mt-3 text-[13px] text-red-300/90">{error}</p>}
          {card && (
            <div className="mt-4">
              <div className="flex items-center gap-2">
                <p className="min-w-0 flex-1 truncate text-[13px] text-white/70">{card}</p>
                <button onClick={async () => { await navigator.clipboard.writeText(card); setCopied(true); }} className="shrink-0 rounded-full bg-white/10 px-3 py-1.5 text-[12px] text-white">{copied ? 'copied' : 'copy card'}</button>
              </div>
              <ul className="mt-3 space-y-1">
                {rows.map((r) => (
                  <li key={r.embed} className="truncate text-[12px] text-white/45">{r.name} · {r.embed}</li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
