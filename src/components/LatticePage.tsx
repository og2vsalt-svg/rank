import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { shareUrls } from '../lib/cloudShare';

type Pack = { id: string; title: string; ids: string[]; note: string };

function load(): Pack[] {
  try {
    return JSON.parse(localStorage.getItem('rv-lattice') || '[]');
  } catch {
    return [];
  }
}

export default function LatticePage() {
  const { navigate } = useRouter();
  const [packs, setPacks] = useState<Pack[]>(load);
  const [title, setTitle] = useState('quiet set');
  const [raw, setRaw] = useState('');
  const [note, setNote] = useState('');

  const persist = (next: Pack[]) => {
    setPacks(next);
    localStorage.setItem('rv-lattice', JSON.stringify(next));
  };

  const parsed = useMemo(
    () =>
      raw
        .split(/[\s,]+/)
        .map((s) => s.replace(/^.*[?&]f=/, '').replace(/\/#share.*/, '').trim())
        .filter(Boolean),
    [raw],
  );

  const add = () => {
    if (!parsed.length) return;
    persist([{ id: Date.now().toString(36), title: title || 'set', ids: parsed, note }, ...packs].slice(0, 40));
    setRaw('');
    setNote('');
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">lattice</p>
          <h1 className="text-3xl font-semibold mb-3">bundle share ids into a set.</h1>
          <p className="text-neutral-400 text-sm mb-6">not a vault. just a little tray of public drops you already made.</p>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full mb-3 bg-white/5 rounded-2xl px-4 py-3 text-sm outline-none" placeholder="set name" />
          <textarea value={raw} onChange={(e) => setRaw(e.target.value)} rows={4} className="w-full mb-3 bg-white/5 rounded-2xl px-4 py-3 text-sm outline-none" placeholder="paste share ids or #share?f= links" />
          <input value={note} onChange={(e) => setNote(e.target.value)} className="w-full mb-4 bg-white/5 rounded-2xl px-4 py-3 text-sm outline-none" placeholder="optional note" />
          <p className="text-xs text-neutral-500 mb-4">{parsed.length} ids ready. huge lists can feel slow to open later.</p>
          <button onClick={add} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">save set</button>
        </motion.div>
        <div className="mt-6 space-y-3">
          {packs.map((p) => (
            <div key={p.id} className="glass rounded-[24px] p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{p.title}</p>
                  <p className="text-xs text-neutral-500 mt-1">{p.ids.length} drops · {p.note || 'no note'}</p>
                </div>
                <button onClick={() => persist(packs.filter((x) => x.id !== p.id))} className="text-xs text-neutral-500">forget</button>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {p.ids.slice(0, 12).map((id) => (
                  <button key={id} onClick={() => navigate('share', id)} className="px-3 py-1.5 rounded-full bg-white/5 text-xs text-neutral-300">
                    {id.slice(0, 10)}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-neutral-600 mt-3 break-all">{p.ids.map((id) => shareUrls(id).embed).join('  ')}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
