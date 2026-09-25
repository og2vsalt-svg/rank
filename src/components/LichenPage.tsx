import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function LichenPage() {
  const [text, setText] = useState('quiet note');
  const [img, setImg] = useState('');

  const render = () => {
    const c = document.createElement('canvas');
    c.width = 1200;
    c.height = 630;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const g = ctx.createLinearGradient(0, 0, 1200, 630);
    g.addColorStop(0, '#0b0b0d');
    g.addColorStop(1, '#14161c');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1200, 630);
    ctx.fillStyle = '#0a84ff';
    ctx.font = '500 22px Inter, system-ui, sans-serif';
    ctx.fillText('rankvault', 72, 88);
    ctx.fillStyle = '#f5f5f7';
    ctx.font = '600 48px Inter, system-ui, sans-serif';
    const lines = text.slice(0, 180).split('\n');
    lines.slice(0, 5).forEach((line, i) => ctx.fillText(line.slice(0, 36), 72, 180 + i * 58));
    ctx.fillStyle = '#86868b';
    ctx.font = '400 20px Inter, system-ui, sans-serif';
    ctx.fillText('lichen card', 72, 560);
    setImg(c.toDataURL('image/png'));
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">lichen</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">grow a card.</h1>
          <p className="text-neutral-400 text-sm mb-6">type a line, paint a 1200×630 png for discord previews. stays local till you drop it.</p>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} className="w-full rounded-2xl bg-white/5 border border-white/10 p-4 text-sm outline-none mb-4" />
          <button onClick={render} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">paint card</button>
          {img && (
            <div className="mt-6 space-y-4">
              <img src={img} alt="" className="w-full rounded-2xl" />
              <a href={img} download="lichen.png" className="inline-flex px-5 py-2.5 rounded-full bg-white/5 text-sm">download png</a>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
