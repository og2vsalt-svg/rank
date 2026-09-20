import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function QrPage() {
  const [text, setText] = useState('https://');
  const src = useMemo(() => {
    const q = encodeURIComponent(text || 'rankvault');
    return `https://api.qrserver.com/v1/create-qr-code/?size=480x480&margin=12&data=${q}`;
  }, [text]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">qr</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">turn a link into a square.</h1>
          <p className="text-neutral-400 text-sm mb-6">handy when a drop url is too long to shout across a room.</p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none mb-5"
            placeholder="paste a share url"
          />
          <div className="rounded-3xl bg-white p-4 inline-block">
            <img src={src} alt="qr" width={240} height={240} className="rounded-xl" />
          </div>
          <div className="mt-5">
            <a href={src} download="rank-qr.png" className="inline-flex px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">download png</a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
