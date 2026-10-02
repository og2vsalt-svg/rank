import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

type Item = { id: string; name: string; size: number; file_url?: string; share_id?: string };

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function GammonPage() {
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [roomId, setRoomId] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');

  const open = async (id: string) => {
    const res = await fetch(`/api/ferry?id=${encodeURIComponent(id)}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(data.error || 'room missing');
      return;
    }
    setRoomId(data.room.id);
    setTitle(data.room.title || '');
    setNote(data.room.note || '');
    setItems(data.items || []);
  };

  const make = async () => {
    setBusy(true);
    setErr('');
    const res = await fetch('/api/ferry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim() || 'untitled room', note }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setErr(data.error || 'room did not open');
      return;
    }
    setRoomId(data.room.id);
    history.replaceState(null, '', `${location.pathname}#gammon?f=${data.room.id}`);
  };

  const addFile = async (file: File) => {
    if (!roomId) {
      setErr('open a room first');
      return;
    }
    setWarn(file.size > 40 * 1024 * 1024 ? 'large file. the tab may feel slow. no cap.' : '');
    setBusy(true);
    setErr('');
    const published = await publishLocalFile(file, { caption: title || file.name, color: '#0A84FF' });
    if (!published.ok || !published.id) {
      setBusy(false);
      setErr(published.error || 'file did not land');
      return;
    }
    const res = await fetch('/api/ferry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId,
        item: { shareId: published.id, name: file.name, mime: file.type, size: file.size, fileUrl: published.url },
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setErr(data.error || 'room note failed');
      return;
    }
    setItems((list) => [data.item, ...list]);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] uppercase tracking-[0.16em] text-zinc-500">gammon</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="mt-2 text-4xl font-semibold tracking-tight">A room, not a drawer.</motion.h1>
        <p className="mt-3 max-w-xl text-zinc-400">Open a shared room in the database, then drop local files into it. Each file still gets a Discord card.</p>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="room title" className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none" />
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="a short note for the room" className="mt-3 h-24 w-full resize-none rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none" />
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={make} disabled={busy} className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black disabled:opacity-40">open room</button>
            <button onClick={() => roomId && open(roomId)} className="rounded-full bg-white/10 px-5 py-2.5 text-sm">refresh</button>
          </div>
          <div className="mt-4 flex gap-2">
            <input id="room-lookup" placeholder="room id" className="flex-1 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none" onKeyDown={(e) => { if (e.key === 'Enter') open((e.target as HTMLInputElement).value.trim()); }} />
            <button onClick={() => open((document.getElementById('room-lookup') as HTMLInputElement).value.trim())} className="rounded-full bg-[#0A84FF] px-4 text-sm font-medium text-white">look up</button>
          </div>
          {roomId && <p className="mt-4 text-sm text-zinc-400">room <span className="text-zinc-100">{roomId}</span> · discord path /room/{roomId}</p>}
          {warn && <p className="mt-2 text-xs text-amber-200/90">{warn}</p>}
          {err && <p className="mt-2 text-sm text-rose-300">{err}</p>}
          {roomId && (
            <label className="mt-4 block cursor-pointer rounded-2xl border border-dashed border-white/15 px-4 py-6 text-center text-sm text-zinc-300">
              <input type="file" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) addFile(f); }} />
              drop a local file into this room
            </label>
          )}
          <ul className="mt-5 space-y-2">
            {items.map((item) => (
              <li key={item.id || uid()} className="flex items-center justify-between rounded-2xl bg-black/20 px-4 py-3 text-sm">
                <span className="truncate pr-3">{item.name}</span>
                {item.share_id && <a className="text-[#0A84FF]" href={`/s/${item.share_id}`}>/s/{item.share_id}</a>}
              </li>
            ))}
          </ul>
        </motion.div>
      </main>
    </div>
  );
}
