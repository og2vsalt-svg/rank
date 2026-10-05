import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function mint() {
  const a = crypto.randomUUID().replace(/-/g, '').slice(0, 10);
  const b = Date.now().toString(36);
  return `${a}-${b}`;
}

export default function ThimblePage() {
  const [ids, setIds] = useState<string[]>(() => Array.from({ length: 6 }, mint));
  const [copied, setCopied] = useState('');

  const more = () => setIds(Array.from({ length: 6 }, mint));

  const copy = async (id: string) => {
    await navigator.clipboard.writeText(id);
    setCopied(id);
    setTimeout(() => setCopied(''), 1200);
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
          <p className="text-[#0a84ff] text-sm mb-2">thimble</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">short ids for quiet links.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            mint share-shaped tokens on this device. use them as drop ids if you like.
          </p>
          <ul className="space-y-2">
            {ids.map((id) => (
              <li key={id}>
                <button
                  onClick={() => copy(id)}
                  className="w-full text-left px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/8 transition text-sm font-mono text-white"
                >
                  {id}
                  <span className="float-right text-neutral-500">{copied === id ? 'copied' : 'copy'}</span>
                </button>
              </li>
            ))}
          </ul>
          <button onClick={more} className="mt-6 px-4 py-2 rounded-full bg-[#0a84ff] text-white text-sm">
            mint another set
          </button>
        </motion.div>
      </div>
    </div>
  );
}
