import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';

type Note = { id: string; share: string; body: string; at: number };
const KEY = 'rank.yarn.v1';
function loadAll(): Note[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}

export default function YarnPage() {
  const { shareId } = useRouter();
  const [share, setShare] = useState(shareId || '');
  const [body, setBody] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => { setNotes(loadAll()); }, []);

  const add = () => {
    if (!body.trim()) return;
    const next = [{ id: crypto.randomUUID(), share: share.trim() || 'loose', body: body.trim(), at: Date.now() }, ...notes];
    setNotes(next);
    localStorage.setItem(KEY, JSON.stringify(next.slice(0, 200)));
    setBody('');
  };

  const filtered = notes.filter((n) => !share.trim() || n.share === share.trim());

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">yarn</p>
          <h1 className="text-3xl font-semibold mb-3">leave a thread on a drop.</h1>
          <p className="text-neutral-400 text-sm mb-6">local comments tied to a share id. stays on this device so the vault stays clean.</p>
          <input value={share} onChange={(e) => setShare(e.target.value)} placeholder="share id (optional filter)" className="w-full mb-3 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="say something quiet" className="w-full min-h-[100px] mb-4 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none" />
          <button onClick={add} className="px-5 py-2.5 rounded-full bg-[#0a84ff] text-sm mb-6">pin note</button>
          <ul className="space-y-3">
            {filtered.map((n) => (
              <li key={n.id} className="rounded-2xl bg-white/[0.04] px-4 py-3">
                <p className="text-[11px] text-neutral-500 mb-1">{n.share} · {new Date(n.at).toLocaleString()}</p>
                <p className="text-sm whitespace-pre-wrap">{n.body}</p>
              </li>
            ))}
            {!filtered.length && <p className="text-sm text-neutral-500">no yarn yet.</p>}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
