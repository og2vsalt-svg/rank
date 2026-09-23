import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { useRouter } from './Router';

type Beat = { id: string; at: string; text: string };

export default function HelixPage() {
  const vault = useVault() as any;
  const { navigate } = useRouter();
  const [draft, setDraft] = useState('');
  const [beats, setBeats] = useState<Beat[]>([]);
  const [msg, setMsg] = useState('');

  const add = () => {
    const text = draft.trim();
    if (!text) return;
    setBeats((b) => [{ id: Math.random().toString(36).slice(2, 9), at: new Date().toISOString(), text }, ...b]);
    setDraft('');
  };

  const publish = async () => {
    if (!beats.length) return;
    const body = beats
      .slice()
      .reverse()
      .map((b) => `[${b.at}]\n${b.text}\n`)
      .join('\n');
    const res = await vault.addText?.(`helix-${Date.now()}.txt`, body, 'helix');
    setMsg(res?.ok === false ? res.error || 'could not save' : 'saved to vault as a text drop. flip it public from vault or drop.');
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">helix</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">stack a thread, ship it as one file.</h1>
          <p className="text-neutral-400 text-sm mb-6">not the notes desk. this is a timed log you can publish as a single drop.</p>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="next beat…"
            className="w-full min-h-28 rounded-2xl bg-white/[0.04] border border-white/10 p-4 text-sm outline-none focus:border-[#0a84ff]/50"
          />
          <div className="flex flex-wrap gap-2 mt-4 mb-6">
            <button onClick={add} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">add beat</button>
            <button onClick={publish} className="px-5 py-2.5 rounded-full bg-white/5 text-sm">save thread</button>
            <button onClick={() => navigate('vault')} className="px-5 py-2.5 rounded-full bg-white/5 text-sm">vault</button>
          </div>
          {msg && <p className="text-xs text-neutral-400 mb-4">{msg}</p>}
          <ul className="space-y-3">
            {beats.map((b) => (
              <li key={b.id} className="rounded-2xl bg-white/[0.03] border border-white/5 px-4 py-3">
                <p className="text-[11px] text-neutral-500 mb-1">{b.at}</p>
                <p className="text-sm text-white whitespace-pre-wrap">{b.text}</p>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
