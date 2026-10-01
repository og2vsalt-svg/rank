import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

type Landed = { name: string; id: string; warn?: string | null; error?: string };

export default function DavitPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<Landed[]>([]);
  const [note, setNote] = useState('');

  const hoist = async () => {
    if (!files.length) return;
    setBusy(true);
    const next: Landed[] = [];
    for (const file of files) {
      const res = await publishLocalFile(file, { caption: note.trim() || undefined });
      next.push(res.ok && res.id ? { name: file.name, id: res.id, warn: res.warn } : { name: file.name, id: '', error: res.error || 'missed' });
    }
    setRows(next);
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] uppercase tracking-[0.16em] text-white/45">davit</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">hoist a few locals at once</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">
            Each file gets its own row in the share database and its own Discord card. No size cap — only a warning if a send may feel slow.
          </p>
        </motion.div>
        <div className="mt-8 space-y-3">
          <label className="glass block cursor-pointer rounded-3xl px-4 py-8 text-center text-[14px] text-white/70">
            choose files
            <input type="file" multiple className="hidden" onChange={(e) => setFiles(Array.from(e.target.files || []))} />
          </label>
          {files.length > 0 && (
            <ul className="space-y-1 text-[13px] text-white/60">
              {files.map((f) => (
                <li key={f.name + f.size} className="flex justify-between gap-3">
                  <span className="truncate">{f.name}</span>
                  <span>{f.size > 12 * 1024 * 1024 ? 'may feel slow' : 'ready'}</span>
                </li>
              ))}
            </ul>
          )}
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="caption for every card" className="glass w-full rounded-2xl px-4 py-3 text-[14px] outline-none" />
          <button onClick={hoist} disabled={busy || !files.length} className="rounded-full bg-[#0A84FF] px-5 py-2.5 text-[14px] font-medium transition-transform active:scale-[0.98] disabled:opacity-50">
            {busy ? 'hoisting…' : 'hoist'}
          </button>
          {rows.length > 0 && (
            <div className="space-y-2">
              {rows.map((r) => (
                <div key={r.name} className="glass rounded-2xl px-4 py-3 text-[13px]">
                  <p className="font-medium text-white">{r.name}</p>
                  {r.id ? <p className="mt-1 break-all text-white/70">{shareUrls(r.id).embed}</p> : <p className="mt-1 text-red-300">{r.error}</p>}
                  {r.warn && <p className="mt-1 text-amber-200">{r.warn}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
