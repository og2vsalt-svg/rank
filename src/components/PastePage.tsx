import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';

type Paste = { id: string; title: string; body: string; created: number };
const KEY = 'rank_paste_db';

function load(): Paste[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}
function save(p: Paste[]) { localStorage.setItem(KEY, JSON.stringify(p)); }

export default function PastePage() {
  const { shareId, navigate } = useRouter();
  const [pastes, setPastes] = useState<Paste[]>(load);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const current = useMemo(() => pastes.find((p) => p.id === shareId), [pastes, shareId]);

  const publish = () => {
    if (!body.trim()) return;
    const p: Paste = { id: crypto.randomUUID().slice(0, 8), title: title || 'untitled paste', body, created: Date.now() };
    const next = [p, ...pastes];
    setPastes(next);
    save(next);
    setTitle('');
    setBody('');
    navigate('paste', p.id);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-24 pb-16 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[28px] p-7">
          {current ? (
            <>
              <p className="text-[#0a84ff] text-sm mb-2">paste</p>
              <h1 className="text-3xl font-semibold mb-2">{current.title}</h1>
              <p className="text-xs text-neutral-500 mb-5">{new Date(current.created).toLocaleString()}</p>
              <pre className="text-[13px] text-neutral-200 bg-black/40 rounded-2xl p-4 whitespace-pre-wrap break-all max-h-[480px] overflow-auto">{current.body}</pre>
              <div className="flex gap-2 mt-5">
                <button onClick={() => navigator.clipboard.writeText(window.location.href)} className="px-4 py-2 rounded-full bg-white text-black text-sm">copy link</button>
                <button onClick={() => navigate('paste')} className="px-4 py-2 rounded-full bg-white/5 text-sm">new paste</button>
              </div>
            </>
          ) : (
            <>
              <p className="text-[#0a84ff] text-sm mb-2">paste desk</p>
              <h1 className="text-3xl font-semibold mb-4">dump text. get a link.</h1>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="optional title" className="w-full mb-3 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none" />
              <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="drop logs, keys you already rotated, lyrics, whatever" className="w-full min-h-[240px] mb-4 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none resize-y" />
              <p className="text-xs text-neutral-600 mb-4">no size lock. huge pastes just make this tab a little sleepy.</p>
              <button onClick={publish} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">publish paste</button>
              {!!pastes.length && (
                <div className="mt-8 space-y-2">
                  <p className="text-xs text-neutral-500">recent on this device</p>
                  {pastes.slice(0, 8).map((p) => (
                    <button key={p.id} onClick={() => navigate('paste', p.id)} className="block w-full text-left text-sm text-neutral-300 hover:text-white py-1">
                      {p.title}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
