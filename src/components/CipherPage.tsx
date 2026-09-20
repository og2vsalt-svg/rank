import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function xor(text: string, key: string) {
  if (!key) return text;
  let out = '';
  for (let i = 0; i < text.length; i++) {
    out += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return out;
}

function toB64(s: string) {
  try {
    return btoa(unescape(encodeURIComponent(s)));
  } catch {
    return '';
  }
}

function fromB64(s: string) {
  try {
    return decodeURIComponent(escape(atob(s)));
  } catch {
    return '';
  }
}

export default function CipherPage() {
  const [plain, setPlain] = useState('');
  const [key, setKey] = useState('rank');
  const [out, setOut] = useState('');
  const [note, setNote] = useState('');

  function lock() {
    const packed = toB64(xor(plain, key));
    setOut(packed);
    setNote(plain.length > 200_000 ? 'huge blob — tab might feel sleepy' : '');
  }

  function unlock() {
    const raw = fromB64(plain);
    setOut(xor(raw, key));
  }

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20 px-5">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-3">cipher</p>
          <h1 className="text-3xl font-semibold text-white tracking-tight">quiet lockbox</h1>
          <p className="text-sm text-neutral-500 mt-2 mb-8">xor + base64 in the tab. not a vault. nothing leaves this device.</p>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-6 space-y-4">
            <input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="key"
              className="w-full px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none"
            />
            <textarea
              value={plain}
              onChange={(e) => setPlain(e.target.value)}
              placeholder="paste text"
              className="w-full h-40 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none resize-none"
            />
            <div className="flex flex-wrap gap-2">
              <motion.button whileTap={{ scale: 0.97 }} onClick={lock} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">
                lock
              </motion.button>
              <motion.button whileTap={{ scale: 0.97 }} onClick={unlock} className="px-5 py-2.5 rounded-full bg-white/5 text-sm">
                unlock
              </motion.button>
            </div>
            {note && <p className="text-xs text-amber-400/80">{note}</p>}
            {out && (
              <pre className="text-xs text-neutral-400 bg-black/30 rounded-2xl p-4 overflow-auto max-h-56 whitespace-pre-wrap break-all">{out}</pre>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
