import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

type Card = { id: string; text: string; col: 'inbox' | 'doing' | 'done' };

const KEY = 'rankvault-board';

export default function BoardPage() {
  const [cards, setCards] = useState<Card[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '[]');
    } catch {
      return [];
    }
  });
  const [draft, setDraft] = useState('');

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(cards));
  }, [cards]);

  const add = () => {
    const text = draft.trim();
    if (!text) return;
    setCards((c) => [...c, { id: Date.now().toString(36), text, col: 'inbox' }]);
    setDraft('');
  };

  const move = (id: string, col: Card['col']) => setCards((c) => c.map((x) => (x.id === id ? { ...x, col } : x)));
  const kill = (id: string) => setCards((c) => c.filter((x) => x.id !== id));

  const cols: Card['col'][] = ['inbox', 'doing', 'done'];

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0a84ff] text-sm mb-2">board</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a quiet scratch board.</h1>
          <p className="text-neutral-400 text-sm mb-6">not the vault. just notes you can slide around.</p>
          <div className="flex gap-2 mb-6">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && add()}
              placeholder="drop a thought"
              className="flex-1 rounded-full bg-white/5 border border-white/10 px-4 py-2.5 text-sm outline-none"
            />
            <button onClick={add} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">add</button>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {cols.map((col) => (
              <div key={col} className="glass rounded-[28px] p-4 min-h-[280px]">
                <p className="text-xs uppercase tracking-wider text-neutral-500 mb-3">{col}</p>
                <div className="space-y-2">
                  {cards.filter((c) => c.col === col).map((c) => (
                    <div key={c.id} className="rounded-2xl bg-white/5 border border-white/8 p-3">
                      <p className="text-sm text-white mb-2">{c.text}</p>
                      <div className="flex gap-1 flex-wrap">
                        {cols.filter((x) => x !== col).map((x) => (
                          <button key={x} onClick={() => move(c.id, x)} className="text-[11px] text-neutral-400 hover:text-white px-2 py-1 rounded-full glass">{x}</button>
                        ))}
                        <button onClick={() => kill(c.id)} className="text-[11px] text-neutral-500 hover:text-red-400 px-2 py-1">toss</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
