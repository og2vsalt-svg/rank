import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function SaffronPage() {
  const [quote, setQuote] = useState('drop it quiet.');
  const [hue, setHue] = useState(32);
  const color = `hsl(${hue} 80% 56%)`;
  const card = useMemo(
    () =>
      `data:image/svg+xml;charset=utf-8,` +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
          <rect width="1200" height="630" fill="#0b0b0c"/>
          <rect x="48" y="48" width="1104" height="534" rx="48" fill="${color}" fill-opacity="0.14"/>
          <text x="96" y="220" fill="${color}" font-family="Inter,system-ui" font-size="28">saffron</text>
          <text x="96" y="340" fill="#f5f5f7" font-family="Inter,system-ui" font-size="56">${quote.replace(/[<>&]/g, '')}</text>
        </svg>`,
      ),
    [quote, color],
  );

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">saffron</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">warm card maker.</h1>
          <p className="text-neutral-400 text-sm mb-6">stays on this machine. make a soft quote card you can save. not a file vault.</p>
          <input value={quote} onChange={(e) => setQuote(e.target.value.slice(0, 48))} className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none mb-4" />
          <input type="range" min={0} max={360} value={hue} onChange={(e) => setHue(Number(e.target.value))} className="w-full mb-6" />
          <img src={card} alt="" className="w-full rounded-[24px] mb-5 border border-white/10" />
          <a href={card} download="saffron.svg" className="inline-flex px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">save svg</a>
        </motion.div>
      </div>
    </div>
  );
}
