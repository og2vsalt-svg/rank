import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function HearthPage() {
  const [note, setNote] = useState('');
  const [mins, setMins] = useState(25);
  const [left, setLeft] = useState(25 * 60);
  const [on, setOn] = useState(false);

  useEffect(() => {
    setNote(localStorage.getItem('rank_hearth') || '');
  }, []);

  useEffect(() => {
    localStorage.setItem('rank_hearth', note);
  }, [note]);

  useEffect(() => {
    if (!on) return;
    const id = setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          setOn(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [on]);

  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');

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
          <p className="text-[#0a84ff] text-sm mb-2">hearth</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a quiet focus corner.</h1>
          <p className="text-neutral-400 text-sm mb-8">not file hosting. just a soft timer and a scratch note that lives on this device.</p>
          <p className="text-6xl font-semibold tracking-tight tabular-nums mb-6">{mm}:{ss}</p>
          <div className="flex flex-wrap gap-2 mb-8">
            {[15, 25, 45].map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMins(m);
                  setLeft(m * 60);
                  setOn(false);
                }}
                className={`px-4 py-2 rounded-full text-sm transition-colors ${mins === m ? 'bg-white text-black' : 'bg-white/5 text-neutral-300'}`}
              >
                {m}m
              </button>
            ))}
            <button onClick={() => setOn((v) => !v)} className="px-4 py-2 rounded-full text-sm bg-[#0a84ff] text-white">
              {on ? 'pause' : 'start'}
            </button>
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="what are you sitting with"
            className="w-full min-h-[160px] bg-white/[0.03] rounded-2xl p-4 outline-none text-sm resize-none placeholder:text-neutral-600"
          />
        </motion.div>
      </div>
    </div>
  );
}
