import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { getReceipt, saveReceipt } from '../lib/db';
import { useRouter } from './Router';

export default function ReceiptPage() {
  const { shareId, navigate } = useRouter();
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [saved, setSaved] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (shareId) getReceipt(shareId).then(setSaved);
  }, [shareId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const row = await saveReceipt({ name: name.trim(), note: note.trim(), author: author.trim(), size: 0 });
      setSaved(row);
      navigate('receipt', row.id);
    } catch (err) {
      setError(err instanceof Error ? err.message.slice(0, 180) : 'could not save the receipt');
    }
  }

  return (
    <div className="min-h-screen bg-[#050506] text-white">
      <Navbar />
      <main className="max-w-xl mx-auto px-5 pt-24 pb-20">
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[#ffd60a] text-sm mb-3">receipt</motion.p>
        <h1 className="text-4xl font-semibold tracking-tight mb-3">A note that travels with a handoff.</h1>
        <p className="text-neutral-400 mb-8">Not another drawer. Write who it is for, and the link carries a Discord card.</p>
        {saved ? (
          <article className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
            <p className="text-xs text-neutral-500 mb-2">receipt {saved.id}</p>
            <h2 className="text-2xl font-medium">{saved.name}</h2>
            <p className="text-neutral-300 mt-2 leading-relaxed">{saved.note || 'no note'}</p>
            <p className="text-sm text-neutral-500 mt-4">{saved.author || 'unsigned'} · {window.location.origin}/receipt/{saved.id}</p>
          </article>
        ) : (
          <form onSubmit={onSubmit} className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 space-y-3">
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="what changed hands" className="w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-sm outline-none" />
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="from" className="w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-sm outline-none" />
            <textarea required value={note} onChange={(e) => setNote(e.target.value)} placeholder="why it matters" rows={4} className="w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-sm outline-none" />
            {error && <p className="text-sm text-red-300">{error}</p>}
            <button className="w-full rounded-full bg-white text-black py-3 text-sm font-medium">save receipt</button>
          </form>
        )}
      </main>
    </div>
  );
}
