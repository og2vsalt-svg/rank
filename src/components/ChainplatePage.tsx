import { useEffect, useState } from 'react';
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

type Item = { id: string; board: string; label: string; done: boolean; author: string | null; file_id: string | null; created_at: string };

function headers() {
  return { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' };
}

export default function ChainplatePage() {
  const [board, setBoard] = useState('main');
  const [label, setLabel] = useState('');
  const [author, setAuthor] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');
  const [card, setCard] = useState('');

  const load = async (next = board) => {
    const res = await fetch(
      `${SB_URL}/rest/v1/chainplate_items?board=eq.${encodeURIComponent(next)}&select=*&order=created_at.desc&limit=40`,
      { headers: headers() },
    );
    if (!res.ok) return;
    const rows = await res.json();
    if (Array.isArray(rows)) setItems(rows);
  };

  useEffect(() => { load('main').catch(() => {}); }, []);

  const add = async () => {
    const line = label.trim();
    if (!line) return;
    setBusy(true);
    setErr('');
    try {
      let fileId: string | null = null;
      if (file) {
        setWarn(file.size > 20 * 1024 * 1024 ? 'large attachment. sending may feel slow. it is not refused.' : '');
        const filed = await publishLocalFile(file, { caption: line, author: author || 'chainplate', cardTitle: file.name, color: '#30D158' });
        if (!filed.ok || !filed.id) {
          setErr(filed.error || 'file did not land in the share table');
          return;
        }
        fileId = filed.id;
        setCard(shareUrls(filed.id).embed);
        try { await navigator.clipboard.writeText(shareUrls(filed.id).embed); } catch {}
      } else {
        const link = `${location.origin}/chainplate`;
        setCard(link);
        try { await navigator.clipboard.writeText(link); } catch {}
      }
      const res = await fetch(`${SB_URL}/rest/v1/chainplate_items`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ board: board.trim() || 'main', label: line.slice(0, 180), author: author || null, file_id: fileId, done: false }),
      });
      if (!res.ok) {
        setErr((await res.text()).slice(0, 180) || 'board refused the item');
        return;
      }
      setLabel('');
      setFile(null);
      await load(board.trim() || 'main');
    } catch (e: any) {
      setErr(e?.message || 'could not add it');
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (item: Item) => {
    const res = await fetch(`${SB_URL}/rest/v1/chainplate_items?id=eq.${item.id}`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify({ done: !item.done }),
    });
    if (!res.ok) {
      setErr('could not update that tick');
      return;
    }
    setItems((prev) => prev.map((row) => (row.id === item.id ? { ...row, done: !row.done } : row)));
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#30d158] text-sm mb-2">chainplate</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a list that holds.</h1>
          <p className="text-neutral-400 text-sm mb-6">ticks live in the chainplate table. attach a local file only if the item needs one — those bytes go to the share database, with a Discord card. no size lock.</p>
          <div className="space-y-3">
            <input value={board} onChange={(e) => setBoard(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40))} onBlur={() => load(board || 'main')} placeholder="board" className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#30d158]/40" />
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="what needs doing" className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#30d158]/40" />
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="name, optional" className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#30d158]/40" />
            <label className="block cursor-pointer rounded-2xl border border-dashed border-white/15 px-4 py-4 text-sm text-neutral-400 hover:border-[#30d158]/40 transition">
              <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              {file ? file.name : 'optional local file'}
            </label>
            <button onClick={add} disabled={busy} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50">{busy ? 'adding…' : 'add the item'}</button>
          </div>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {card && <p className="text-xs text-neutral-400 mt-4 break-all">copied: {card}</p>}
        </motion.div>
        <ul className="mt-4 space-y-2">
          {items.map((item, i) => (
            <motion.li key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 6) * 0.03 }} className="glass rounded-2xl px-4 py-3 flex items-start gap-3">
              <button onClick={() => toggle(item)} className={`mt-0.5 w-5 h-5 rounded-full border shrink-0 transition ${item.done ? 'bg-[#30d158] border-[#30d158]' : 'border-white/20'}`} aria-label="toggle" />
              <div className="min-w-0">
                <p className={`text-sm ${item.done ? 'text-neutral-500 line-through' : 'text-white'}`}>{item.label}</p>
                <p className="text-xs text-neutral-500 mt-1">
                  {item.author || 'someone'}
                  {item.file_id ? <> · <a className="text-[#0a84ff]" href={`${location.origin}/s/${item.file_id}`}>file card</a></> : null}
                </p>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  );
}
