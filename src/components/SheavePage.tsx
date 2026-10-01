import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

const SB_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SB_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type Part = { name: string; id: string; card: string; size: number };

export default function SheavePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [busy, setBusy] = useState(false);
  const [parts, setParts] = useState<Part[]>([]);
  const [card, setCard] = useState('');
  const [error, setError] = useState('');
  const [warn, setWarn] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const total = useMemo(() => files.reduce((n, f) => n + f.size, 0), [files]);
  const totalLabel = total >= 1024 * 1024 ? `${(total / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(total / 1024))} KB`;

  const run = async () => {
    if (!files.length) return;
    setBusy(true);
    setError('');
    setParts([]);
    setCard('');
    const landed: Part[] = [];
    for (const file of files) {
      const res = await publishLocalFile(file, {
        caption: note.trim().slice(0, 180),
        author: author.trim(),
        color: '#64D2FF',
      });
      if (!res.ok || !res.id) {
        setError(res.error || `could not file ${file.name}`);
        setBusy(false);
        setParts(landed);
        return;
      }
      landed.push({ name: file.name, id: res.id, card: res.embed || shareUrls(res.id).embed, size: file.size });
    }
    const packId = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    const heading = title.trim() || 'sheave pack';
    const lines = [
      `# ${heading}`,
      note.trim(),
      '',
      ...landed.map((p, i) => `${i + 1}. ${p.name} \u2014 ${p.card}`),
    ].filter(Boolean).join('\n');
    const index = new File([lines], `${heading.replace(/[^a-z0-9]+/gi, '-').slice(0, 40) || 'sheave'}.md`, { type: 'text/markdown' });
    const indexRes = await publishLocalFile(index, {
      caption: note.trim().slice(0, 180) || `${landed.length} files on one card`,
      author: author.trim(),
      color: '#64D2FF',
    });
    try {
      await fetch(`${SB_URL}/rest/v1/share_packs`, {
        method: 'POST',
        headers: {
          apikey: SB_KEY,
          Authorization: `Bearer ${SB_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          id: packId,
          title: heading.slice(0, 140),
          note: note.trim() || null,
          author: author.trim() || null,
          part_ids: landed.map((p) => p.id),
        }),
      });
    } catch {
      // the public index file is the card; the pack row is extra
    }
    setParts(landed);
    setCard(indexRes.embed || (indexRes.id ? shareUrls(indexRes.id).embed : ''));
    setWarn(total > 24 * 1024 * 1024 ? 'heavy sheave. the tab may pause while each file pays out. nothing is refused.' : indexRes.warn || null);
    if (!indexRes.ok) setError(indexRes.error || 'files landed, index card did not');
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] uppercase tracking-[0.16em] text-white/45">sheave</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">one block, several lines</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">Each local file lands in the share table. A markdown index and a pack row keep the set together. Discord unfurls the index card.</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.55 }} className="glass mt-8 rounded-3xl p-5">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-black/25 px-4 py-10 text-center transition hover:border-white/30">
            <span className="text-[15px] text-white">{files.length ? `${files.length} files · ${totalLabel}` : 'choose the set'}</span>
            <span className="mt-1 text-[13px] text-white/45">from this machine. no size ceiling, only a slowness note.</span>
            <input type="file" multiple className="sr-only" onChange={(e) => setFiles(Array.from(e.target.files || []))} />
          </label>
          {files.length > 0 && (
            <ul className="mt-3 space-y-1 text-[13px] text-white/55">
              {files.map((f) => <li key={f.name + f.size} className="truncate">{f.name}</li>)}
            </ul>
          )}
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="pack title" className="mt-3 w-full rounded-2xl bg-black/30 px-4 py-3 text-[15px] outline-none placeholder:text-white/30" />
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="note for the card" rows={3} className="mt-3 w-full resize-none rounded-2xl bg-black/30 px-4 py-3 text-[15px] outline-none placeholder:text-white/30" />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="from" className="mt-3 w-full rounded-2xl bg-black/30 px-4 py-3 text-[15px] outline-none placeholder:text-white/30" />
          <button onClick={run} disabled={!files.length || busy} className="mt-4 rounded-full bg-white px-5 py-2.5 text-[14px] font-medium text-black transition hover:bg-neutral-200 disabled:opacity-50">{busy ? 'reeving…' : 'reeve the sheave'}</button>
          {warn && <p className="mt-3 text-[13px] text-amber-200/80">{warn}</p>}
          {error && <p className="mt-3 text-[13px] text-red-300/90">{error}</p>}
          {card && (
            <div className="mt-4 flex items-center gap-2">
              <p className="min-w-0 flex-1 truncate text-[13px] text-white/70">{card}</p>
              <button onClick={async () => { await navigator.clipboard.writeText(card); setCopied(true); }} className="shrink-0 rounded-full bg-white/10 px-3 py-1.5 text-[12px] text-white">{copied ? 'copied' : 'discord'}</button>
            </div>
          )}
          {parts.length > 0 && (
            <ul className="mt-3 space-y-1 text-[12px] text-white/45">
              {parts.map((p) => <li key={p.id} className="truncate">{p.name} · {p.card}</li>)}
            </ul>
          )}
        </motion.div>
      </main>
    </div>
  );
}
