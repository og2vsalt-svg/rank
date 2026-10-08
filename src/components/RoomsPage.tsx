import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';

type Room = { id: string; url: string; note: string | null; author: string | null; created_at: string };

export default function RoomsPage() {
  const [title, setTitle] = useState('');
  const [href, setHref] = useState('');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [note, setNote] = useState('');

  async function load() {
    const rows = await fetch('/api/keep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'pins' }),
    }).then((r) => r.json()).catch(() => null);
    if (rows && Array.isArray(rows.links)) setRooms(rows.links);
  }

  useEffect(() => { load(); }, []);

  async function save() {
    const url = href.trim();
    if (!url) return;
    setNote('pinning…');
    const res = await fetch('/api/keep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'pin', url, note: title || 'room', author: 'studio' }),
    }).then((r) => r.json()).catch(() => ({ error: 'could not pin' }));
    if (res.error) setNote(res.error);
    else {
      setTitle('');
      setHref('');
      setNote('pinned.');
      load();
    }
  }

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-16 px-5">
        <div className="max-w-2xl mx-auto">
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[#0a84ff] text-sm font-medium mb-3">rooms</motion.p>
          <h1 className="text-4xl font-semibold tracking-tight text-white mb-3">a board of links.</h1>
          <p className="text-neutral-400 mb-8">Pin share links, notes, or anything else into the existing links table. Older desks stay where they are.</p>
          <div className="glass rounded-3xl p-5 space-y-3 mb-6">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="label" className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none" />
            <input value={href} onChange={(e) => setHref(e.target.value)} placeholder="https:// or /s/id" className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none" />
            <button onClick={save} className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium active:scale-[0.98] transition">pin</button>
            {note && <p className="text-sm text-neutral-500">{note}</p>}
          </div>
          <div className="space-y-2">
            {rooms.map((room) => (
              <a key={room.id} href={room.url} className="block glass rounded-2xl px-4 py-3 hover:bg-white/[0.05] transition">
                <p className="text-sm text-white">{room.note || 'link'}</p>
                <p className="text-xs text-neutral-500 truncate">{room.url}</p>
              </a>
            ))}
            {!rooms.length && <p className="text-sm text-neutral-500">nothing pinned yet.</p>}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
