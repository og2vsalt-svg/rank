import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from './Router';

export default function PulseDeskPage() {
  const { navigate } = useRouter();
  const [pulses, setPulses] = useState([{ id: 1, name: 'welcome.pulse', time: 'just now', status: 'ready' }]);
  const [note, setNote] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setPulses(prev => [
        { id: Date.now(), name: `echo-${Math.floor(Math.random()*1000)}.file`, time: 'now', status: 'pulsing' },
        ...prev.slice(0, 4)
      ]);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const addPulse = () => {
    if (!note.trim()) return;
    setPulses(prev => [
      { id: Date.now(), name: note.slice(0, 20) + '.note', time: 'just now', status: 'shared' },
      ...prev
    ]);
    setNote('');
  };

  return (
    <div className="min-h-screen mesh pt-28 pb-16 px-5">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="glass rounded-3xl p-8 mb-6"
        >
          <h1 className="text-4xl font-semibold text-white mb-2 tracking-tight">Pulse Desk</h1>
          <p className="text-neutral-400 mb-6">Live echoes of your shared files. Soft pulses, no limits. Apple-smooth animations.</p>
          <div className="flex gap-3">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="add a pulse note..."
              className="flex-1 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-[#0A84FF]"
            />
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={addPulse}
              className="px-6 py-3 rounded-2xl bg-[#0A84FF] text-white font-medium"
            >
              pulse
            </motion.button>
          </div>
        </motion.div>

        <div className="space-y-3">
          {pulses.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, type: 'spring', stiffness: 120 }}
              className="glass rounded-2xl p-5 flex items-center justify-between"
            >
              <div>
                <div className="text-white font-medium">{p.name}</div>
                <div className="text-xs text-neutral-500">{p.time} · {p.status}</div>
              </div>
              <div className="w-2 h-2 rounded-full bg-[#30D158] animate-pulse" />
            </motion.div>
          ))}
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('home')}
          className="mt-8 text-sm text-neutral-400 hover:text-white"
        >
          ← back home
        </motion.button>
      </div>
    </div>
  );
}
