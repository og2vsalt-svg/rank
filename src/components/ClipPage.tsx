import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';

type Clip = { id: string; body: string; createdAt: string };
const KEY = 'rank_clips_v1';

function load(): Clip[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export default function ClipPage() {
  const { shareId } = useRouter();
  const [clips, setClips] = useState<Clip[]>(load);
  const [body, setBody] = useState('');
  const active = clips.find((c) => c.id === shareId);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(clips));
  }, [clips]);

  const publish = () => {
    if (!body.trim()) return;
    const clip = { id: uid(), body, createdAt: new Date().toISOString() };
    setClips((c) => [clip, ...c]);
    setBody('');
    window.location.hash = `clip?f=${clip.id}`;
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">clip</p>
          {active ? (
            <>
              <h1 className="text-3xl font-semibold tracking-tight mb-3">open clip</h1>
              <p className="text-xs text-neutral-500 mb-4">{new Date(active.createdAt).toLocaleString()}</p>
              <pre className="whitespace-pre-wrap text-sm text-neutral-200 bg-black/30 rounded-2xl p-4 mb-5">{active.body}</pre>
              <button onClick={() => navigator.clipboard.writeText(active.body)} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">copy text</button>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-semibold tracking-tight mb-3">stash a clip on this device.</h1>
              <p className="text-neutral-400 text-sm mb-6">not the vault. just a short text room with a hash link. lives in local storage.</p>
              <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none mb-4" placeholder="dump text" />
              <button onClick={publish} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">publish clip</button>
              <ul className="mt-8 space-y-2">
                {clips.map((c) => (
                  <li key={c.id}>
                    <button onClick={() => { window.location.hash = `clip?f=${c.id}`; }} className="w-full text-left text-sm text-neutral-400 hover:text-white truncate">
                      {c.body.slice(0, 80) || c.id}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
