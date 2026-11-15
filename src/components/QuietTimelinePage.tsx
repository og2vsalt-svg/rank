import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from './Router';
import Navbar from './Navbar';

export default function QuietTimelinePage() {
  const { navigate } = useRouter();
  const [entries, setEntries] = useState<{id: string; text: string; time: string}[]>([]);
  const [text, setText] = useState('');

  const addEntry = () => {
    if (!text.trim()) return;
    setEntries(prev => [{
      id: Date.now().toString(36),
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }, ...prev]);
    setText('');
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="text-[#30D158] text-sm font-medium mb-3 tracking-wide">timeline</p>
          <h1 className="text-4xl font-semibold tracking-tight text-white mb-4">quiet sequence.</h1>
          <p className="text-neutral-400 mb-8">A still timeline for notes. Local only, no upload. Pair with vault or shares when ready.</p>
        </motion.div>

        <div className="flex gap-2 mb-8">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addEntry()}
            placeholder="add a moment…"
            className="flex-1 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#30D158]/40"
          />
          <button onClick={addEntry} className="px-5 py-3 rounded-2xl bg-white text-black text-sm font-medium active:scale-95">add</button>
        </div>

        <div className="space-y-4">
          {entries.map((e, i) => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="glass rounded-2xl p-4 flex gap-4"
            >
              <div className="text-xs text-[#30D158] pt-0.5 shrink-0">{e.time}</div>
              <p className="text-sm text-white leading-relaxed">{e.text}</p>
            </motion.div>
          ))}
          {entries.length === 0 && <p className="text-center text-neutral-600 text-sm">nothing yet</p>}
        </div>

        <div className="mt-10 text-center">
          <button onClick={() => navigate('vault')} className="px-6 py-3 rounded-full glass text-sm">open vault</button>
        </div>
      </div>
    </div>
  );
}
