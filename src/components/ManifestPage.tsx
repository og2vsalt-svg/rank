import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

const SB_URL = ((import.meta as any).env?.VITE_SUPABASE_URL || 'https://tqfocdktvjuwoiyfgesb.supabase.co').replace(/\/$/, '');
const SB_KEY =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type Filed = { name: string; id: string; size: number; embed: string };

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export default function ManifestPage() {
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [error, setError] = useState('');
  const [packId, setPackId] = useState('');
  const [filed, setFiled] = useState<Filed[]>([]);

  const bytes = useMemo(() => files.reduce((n, f) => n + f.size, 0), [files]);

  const onPick = (list: FileList | null) => {
    const next = Array.from(list || []);
    setFiles(next);
    const heavy = next.filter((f) => f.size > 25 * 1024 * 1024);
    setWarn(heavy.length ? `${heavy.length} file${heavy.length === 1 ? '' : 's'} over 25 MB. nothing is refused — the tab may just feel slow while they leave.` : '');
  };

  const filePack = async () => {
    if (!files.length) {
      setError('add at least one local file');
      return;
    }
    setBusy(true);
    setError('');
    const id = uid();
    const landed: Filed[] = [];
    try {
      for (const file of files) {
        const res = await publishLocalFile(file, {
          caption: note || title || 'manifest drop',
          author: author || undefined,
          cardTitle: file.name,
        });
        if (!res.ok || !res.id) throw new Error(res.error || `could not file ${file.name}`);
        landed.push({ name: file.name, id: res.id, size: file.size, embed: res.embed || `${location.origin}/s/${res.id}` });
      }
      const row = {
        id,
        title: (title || 'untitled pack').slice(0, 160),
        note: note || null,
        author: author || null,
        accent: '#0A84FF',
        items: landed,
      };
      const ins = await fetch(`${SB_URL}/rest/v1/manifests`, {
        method: 'POST',
        headers: {
          apikey: SB_KEY,
          Authorization: `Bearer ${SB_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify(row),
      });
      if (!ins.ok) throw new Error((await ins.text()).slice(0, 180));
      setPackId(id);
      setFiled(landed);
    } catch (err: any) {
      setError(err?.message || 'filing failed');
    } finally {
      setBusy(false);
    }
  };

  const packLink = packId ? `${location.origin}/manifest#${packId}` : '';

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0a84ff] text-sm font-medium mb-2">manifest</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mb-3">several files, one handover.</h1>
          <p className="text-neutral-400 max-w-xl mb-8">Each local file is written into the share table. The pack itself is a row in manifests, so the list survives a refresh. Discord still unfurls every /s link.</p>
        </motion.div>
        <div className="glass rounded-3xl p-6 sm:p-8 space-y-4">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="pack title" className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#0a84ff]/50" />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="your name, optional" className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#0a84ff]/50" />
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="a line for the card" rows={3} className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#0a84ff]/50" />
          <label className="block rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-8 text-center cursor-pointer hover:bg-white/[0.05] transition">
            <input type="file" multiple className="hidden" onChange={(e) => onPick(e.target.files)} />
            <span className="text-sm text-white">{files.length ? `${files.length} selected · ${(bytes / (1024 * 1024)).toFixed(1)} MB` : 'choose local files'}</span>
            <span className="block text-xs text-neutral-500 mt-1">no size cutoff. large drops only get a warning.</span>
          </label>
          {warn && <p className="text-xs text-amber-300/90">{warn}</p>}
          {error && <p className="text-xs text-red-300">{error}</p>}
          <button disabled={busy} onClick={filePack} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50">
            {busy ? 'filing…' : 'file the pack'}
          </button>
        </div>
        {packId && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 glass rounded-3xl p-6">
            <p className="text-xs text-neutral-500 mb-2">pack {packId}</p>
            <p className="text-sm text-white break-all mb-4">{packLink}</p>
            <ul className="space-y-2">
              {filed.map((f) => (
                <li key={f.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate text-neutral-200">{f.name}</span>
                  <button onClick={() => navigator.clipboard.writeText(f.embed)} className="shrink-0 text-xs px-3 py-1 rounded-full bg-white/10">copy /s</button>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </main>
    </div>
  );
}
