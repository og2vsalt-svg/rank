import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function RivuletPage() {
  const [raw, setRaw] = useState('');
  const [copied, setCopied] = useState(-1);

  const streams = useMemo(() => {
    return raw
      .split(/\n\s*\n/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 40);
  }, [raw]);

  const copy = async (i: number, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(i);
    setTimeout(() => setCopied(-1), 900);
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
          <p className="text-[#0a84ff] text-sm mb-2">rivulet</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">split a note into little streams.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            blank lines become banks. copies stay local. nothing is uploaded.
          </p>
          <textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder="paste a long note. leave a blank line between thoughts."
            className="w-full min-h-[180px] rounded-3xl bg-white/5 border border-white/10 p-4 text-sm text-neutral-100 outline-none focus:border-[#0a84ff]/40"
          />
          <p className="text-xs text-neutral-500 mt-3">{streams.length} streams</p>
          <ul className="mt-4 space-y-2">
            {streams.map((s, i) => (
              <li key={i}>
                <button
                  onClick={() => copy(i, s)}
                  className="w-full text-left rounded-2xl bg-white/5 hover:bg-white/8 px-4 py-3 text-sm text-neutral-200 transition"
                >
                  <span className="text-neutral-500 mr-2">{i + 1}</span>
                  {s.slice(0, 140)}
                  {s.length > 140 ? '…' : ''}
                  <span className="float-right text-neutral-500">{copied === i ? 'copied' : 'copy'}</span>
                </button>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
