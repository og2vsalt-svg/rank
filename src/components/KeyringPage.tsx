import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function makePass(n = 12) {
  const alphabet = 'abcdefghijkmnopqrstuvwxyz23456789';
  const buf = new Uint8Array(n);
  crypto.getRandomValues(buf);
  return [...buf].map((b) => alphabet[b % alphabet.length]).join('');
}

export default function KeyringPage() {
  const [pass, setPass] = useState(makePass());
  const [hint, setHint] = useState('');
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(pass);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {}
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">keyring</p>
          <h1 className="text-3xl font-semibold mb-3">mint a lock for a drop.</h1>
          <p className="text-neutral-400 text-sm mb-6">generate a soft password, then paste it into drop / vault when you publish. this page never stores the file.</p>
          <p className="font-mono text-2xl tracking-wide mb-4">{pass}</p>
          <input value={hint} onChange={(e) => setHint(e.target.value)} className="w-full mb-4 bg-white/5 rounded-2xl px-4 py-3 text-sm outline-none" placeholder="private hint only you see" />
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setPass(makePass())} className="px-5 py-2.5 rounded-full bg-white/8 text-sm">new one</button>
            <button onClick={copy} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">{copied ? 'copied' : 'copy'}</button>
          </div>
          {hint && <p className="text-xs text-neutral-500 mt-4">hint stays in this tab only: {hint}</p>}
        </motion.div>
      </div>
    </div>
  );
}
