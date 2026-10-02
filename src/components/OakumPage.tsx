import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

const SB_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type Item = { id: string; name: string; embed: string };

export default function OakumPage() {
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [shelf, setShelf] = useState('');
  const [items, setItems] = useState<Item[]>([]);

  const pack = async () => {
    if (!files.length || !title.trim()) return;
    setBusy(true);
    setErr('');
    const heavy = files.some((f) => f.size > 20 * 1024 * 1024);
    setWarn(heavy ? 'one of these is heavy. the tab may pause. nothing is cut off.' : '');
    const landed: Item[] = [];
    for (const file of files) {
      const result = await publishLocalFile(file, { caption: note || title, author: 'oakum' });
      if (!result.ok || !result.id) {
        setErr(result.error || `could not file ${file.name}`);
        setBusy(false);
        setItems(landed);
        return;
      }
      landed.push({ id: result.id, name: file.name, embed: result.embed || '' });
    }
    const id = Date.now().toString(36);
    const res = await fetch(`${SB_URL}/rest/v1/shelves`, {
      method: 'POST',
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({ id, title: title.trim(), note, author: 'oakum', items: landed }),
    });
    setBusy(false);
    setItems(landed);
    if (!res.ok) {
      setErr('files are in the share table, but the shelf row did not save');
      return;
    }
    const link = `${location.origin}/s/${landed[0].id}`;
    setShelf(link);
    try { await navigator.clipboard.writeText(link); } catch {}
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-24 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[28px] p-6 sm:p-8">
          <p className="text-[13px] text-[#0a84ff] mb-2">oakum</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">caulk a pack, not a cabinet.</h1>
          <p className="text-neutral-400 text-sm mb-6">each local file is written to the share database. the shelf keeps the list. Discord still unfurls the first /s card.</p>
          <input value={title} onChange={(e) => setTitle(e.target.value.slice(0, 80))} placeholder="shelf name" className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none" />
          <textarea value={note} onChange={(e) => setNote(e.target.value.slice(0, 240))} placeholder="note that rides on each card" className="mt-3 w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none min-h-20" />
          <label className="mt-3 block rounded-2xl border border-dashed border-white/15 p-6 cursor-pointer">
            <input type="file" multiple className="hidden" onChange={(e) => setFiles([...(e.target.files || [])])} />
            <p className="text-sm">{files.length ? `${files.length} local file${files.length === 1 ? '' : 's'} ready` : 'choose local files'}</p>
          </label>
          <button disabled={!files.length || !title.trim() || busy} onClick={pack} className="mt-5 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">{busy ? 'filing the pack…' : 'file the pack'}</button>
          {warn && <p className="text-xs text-amber-200/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {shelf && <p className="text-xs text-neutral-300 mt-4 break-all">first discord card copied: {shelf}</p>}
          {items.length > 0 && (
            <ul className="mt-4 space-y-2">
              {items.map((item) => (
                <li key={item.id} className="text-xs text-neutral-400 break-all">{item.name} · /s/{item.id}</li>
              ))}
            </ul>
          )}
        </motion.div>
      </div>
    </div>
  );
}
