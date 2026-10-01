import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

type Row = { name: string; embed: string; warn?: string | null };

export default function CourierPage() {
  const [note, setNote] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');

  const send = async (list: FileList | null) => {
    if (!list?.length) return;
    const files = [...list];
    if (files.some((f) => f.size > 40 * 1024 * 1024)) {
      setWarn('one or more are heavy. the tab may pause while they travel. nothing is blocked.');
    } else setWarn('');
    setBusy(true);
    setErr('');
    const next: Row[] = [];
    for (const file of files) {
      const res = await publishLocalFile(file, { caption: note.trim() || undefined, author: 'courier' });
      if (!res.ok || !res.id) {
        setErr(res.error || `missed ${file.name}`);
        continue;
      }
      next.push({ name: file.name, embed: shareUrls(res.id).embed, warn: res.warn });
    }
    setRows((prev) => [...next, ...prev]);
    setBusy(false);
  };

  const copyAll = async () => {
    await navigator.clipboard.writeText(rows.map((r) => r.embed).join('\n'));
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="max-w-xl mx-auto px-5 pt-28 pb-24">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
          <p className="text-[12px] tracking-[0.18em] uppercase text-white/40">courier</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">a run of files, each with a card</h1>
          <p className="mt-2 text-sm text-white/55 leading-relaxed">Several locals go up together. Each lands as its own row in the share database, with the same note on the Discord unfurl.</p>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="note for every card" rows={2} className="mt-6 w-full rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-3 text-sm outline-none" />
          <label className="mt-3 inline-flex px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium cursor-pointer">
            {busy ? 'carrying…' : 'choose files'}
            <input type="file" multiple className="sr-only" onChange={(e) => send(e.target.files)} />
          </label>
          {warn && <p className="mt-3 text-xs text-amber-200/80">{warn}</p>}
          {err && <p className="mt-3 text-xs text-red-300">{err}</p>}
          {rows.length > 0 && (
            <div className="mt-6">
              <button onClick={copyAll} className="text-xs text-white/50 hover:text-white">copy all discord links</button>
              <ul className="mt-3 space-y-2">
                {rows.map((r) => (
                  <li key={r.embed} className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                    <p className="text-sm">{r.name}</p>
                    <a href={r.embed} className="text-xs text-sky-300 break-all">{r.embed}</a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
