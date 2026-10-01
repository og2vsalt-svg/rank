import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

const SB_URL = (
  (import.meta as any).env?.VITE_SUPABASE_URL ||
  'https://tqfocdktvjuwoiyfgesb.supabase.co'
).replace(/\/$/, '');
const SB_KEY =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type Row = { name: string; id?: string; embed?: string; error?: string; warn?: string | null };

export default function BulkheadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [shelf, setShelf] = useState('');
  const [copied, setCopied] = useState('');
  const heavy = useMemo(() => files.reduce((n, f) => n + f.size, 0) > 40 * 1024 * 1024, [files]);

  const send = async () => {
    if (!files.length) return;
    setBusy(true);
    const next: Row[] = [];
    for (const file of files) {
      const res = await publishLocalFile(file, { author, caption: note || title || file.name });
      next.push({
        name: file.name,
        id: res.id,
        embed: res.id ? shareUrls(res.id).embed : undefined,
        error: res.ok ? undefined : res.error,
        warn: res.warn,
      });
      setRows([...next]);
    }
    const ids = next.map((r) => r.id).filter(Boolean) as string[];
    if (ids.length) {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const res = await fetch(`${SB_URL}/rest/v1/shelves`, {
        method: 'POST',
        headers: {
          apikey: SB_KEY,
          Authorization: `Bearer ${SB_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          id,
          title: title || `${ids.length} files`,
          note: note || null,
          author: author || null,
          share_ids: ids,
        }),
      });
      if (res.ok) setShelf(`${location.origin}/p/bulkhead`);
    }
    setBusy(false);
  };

  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(value);
    setTimeout(() => setCopied(''), 1200);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] uppercase tracking-[0.16em] text-white/45">bulkhead</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">a compartment for a folder</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">
            Each local still gets its own row in public_shares and a Discord card on /s. The set is also written to the shelves table so the hold can show them together. Nothing is refused for size.
          </p>
        </motion.div>
        <label className="glass mt-8 block cursor-pointer rounded-3xl p-8 text-center">
          <input className="hidden" type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} />
          <div className="text-[15px] text-white/80">{files.length ? `${files.length} files in the compartment` : 'choose files from this machine'}</div>
        </label>
        <div className="mt-4 grid gap-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="shelf title" className="glass rounded-2xl px-4 py-3 text-[14px] outline-none" />
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="note that rides on each card" className="glass rounded-2xl px-4 py-3 text-[14px] outline-none" />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="name, optional" className="glass rounded-2xl px-4 py-3 text-[14px] outline-none" />
        </div>
        {heavy && <p className="mt-3 text-[13px] text-amber-200/80">large compartment. sending may pause the tab. nothing is blocked.</p>}
        <button onClick={send} disabled={!files.length || busy} className="mt-4 w-full rounded-full bg-[#0A84FF] px-4 py-3 text-[15px] font-medium text-white disabled:opacity-40">
          {busy ? 'sealing one file at a time…' : 'seal the bulkhead'}
        </button>
        {shelf && <p className="mt-3 text-[13px] text-white/50">shelf saved. open hold to see the set.</p>}
        <div className="mt-6 space-y-2">
          {rows.map((r) => (
            <div key={r.name} className="glass rounded-2xl px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-[14px]">{r.name}</p>
                {r.embed ? (
                  <button onClick={() => copy(r.embed!)} className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-[12px]">{copied === r.embed ? 'copied' : 'copy /s'}</button>
                ) : (
                  <span className="text-[12px] text-red-300">{r.error || 'failed'}</span>
                )}
              </div>
              {r.warn && <p className="mt-1 text-[12px] text-amber-200/80">{r.warn}</p>}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
