import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';
import { sbRest } from '../lib/supabase';

type Pair = { id: string; left_id: string; right_id: string; relation: string; author: string | null };

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export default function CompanionPage() {
  const [left, setLeft] = useState<File | null>(null);
  const [right, setRight] = useState<File | null>(null);
  const [relation, setRelation] = useState('');
  const [author, setAuthor] = useState('');
  const [rows, setRows] = useState<Pair[]>([]);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [error, setError] = useState('');
  const [card, setCard] = useState('');

  async function load() {
    const res = await sbRest('companion_pairs?select=id,left_id,right_id,relation,author,created_at&order=created_at.desc&limit=12');
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data)) setRows(data);
  }

  useEffect(() => { load(); }, []);

  async function send() {
    setError('');
    setWarn('');
    if (!left || !right || !relation.trim()) return;
    const heavy = Math.max(left.size, right.size);
    if (heavy > 40 * 1024 * 1024) setWarn('one of these is large. the tab may feel slow. neither is refused.');
    setBusy(true);
    const a = await publishLocalFile(left, { caption: relation.trim(), author: author.trim(), cardTitle: left.name });
    if (!a.ok || !a.id) {
      setBusy(false);
      setError(a.error || 'left file did not land');
      return;
    }
    const b = await publishLocalFile(right, { caption: relation.trim(), author: author.trim(), cardTitle: right.name });
    if (!b.ok || !b.id) {
      setBusy(false);
      setError(b.error || 'right file did not land');
      return;
    }
    const id = uid();
    const res = await sbRest('companion_pairs', {
      method: 'POST',
      body: JSON.stringify({ id, left_id: a.id, right_id: b.id, relation: relation.trim().slice(0, 280), author: author.trim() || null }),
    });
    setBusy(false);
    if (!res.ok) {
      setError('the pair did not save.');
      return;
    }
    setCard(`${location.origin}/companion/${id}`);
    setRelation('');
    setLeft(null);
    setRight(null);
    await load();
  }

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="max-w-2xl mx-auto px-5 pt-28 pb-24">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-xs uppercase tracking-[0.18em] text-neutral-500">two files, one sentence</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-2 text-4xl font-semibold tracking-tight text-white">companion</motion.h1>
        <p className="mt-3 text-neutral-400 text-[15px] leading-relaxed">hand two local files to the share table and keep the sentence that ties them. not a vault grid. discord unfurls /companion and both /s cards.</p>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 210, damping: 24 }} className="glass rounded-3xl p-6 mt-6">
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="text-xs text-neutral-500">left
              <input type="file" onChange={(e) => setLeft(e.target.files?.[0] || null)} className="mt-1 block w-full text-sm text-neutral-300 file:mr-2 file:rounded-full file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-xs file:text-black" />
            </label>
            <label className="text-xs text-neutral-500">right
              <input type="file" onChange={(e) => setRight(e.target.files?.[0] || null)} className="mt-1 block w-full text-sm text-neutral-300 file:mr-2 file:rounded-full file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-xs file:text-black" />
            </label>
          </div>
          <label className="block text-xs text-neutral-500 mt-3">what they are to each other
            <input value={relation} onChange={(e) => setRelation(e.target.value)} placeholder="draft and print, before and after" className="mt-1 w-full bg-white/5 border border-white/10 rounded-2xl px-3 py-2.5 text-sm text-white outline-none focus:border-white/30" />
          </label>
          <label className="block text-xs text-neutral-500 mt-3">signed
            <input value={author} onChange={(e) => setAuthor(e.target.value)} className="mt-1 w-full bg-white/5 border border-white/10 rounded-2xl px-3 py-2.5 text-sm text-white outline-none" />
          </label>
          {warn && <p className="mt-3 text-xs text-amber-200/90">{warn}</p>}
          {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
          <motion.button whileTap={{ scale: 0.98 }} disabled={!left || !right || !relation.trim() || busy} onClick={send} className="mt-5 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">{busy ? 'pairing…' : 'pair them'}</motion.button>
          {card && <p className="mt-3 text-xs text-[#64d2ff] break-all">{card}</p>}
        </motion.div>
        <div className="mt-8 space-y-2">
          {rows.map((row) => (
            <a key={row.id} href={`/companion/${row.id}`} className="glass rounded-2xl px-4 py-3 block hover:bg-white/[0.04] transition duration-200">
              <p className="text-white text-sm">{row.relation}</p>
              <p className="text-xs text-neutral-500 mt-1">{row.left_id} · {row.right_id}</p>
            </a>
          ))}
        </div>
      </main>
    </div>
  );
}
