import { motion } from 'framer-motion';
import { useRouter } from './Router';

export default function Hero() {
  const { navigate } = useRouter();
  return (
    <section className="relative pt-28 pb-20 px-5 overflow-hidden">
      <div className="absolute top-20 left-1/4 w-72 h-72 bg-[#0a84ff]/[0.12] rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#af52de]/[0.08] rounded-full blur-[120px] pointer-events-none" />
      <div className="relative max-w-3xl mx-auto">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[#0a84ff] text-sm font-medium mb-4 tracking-wide">private file hosting</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="text-4xl sm:text-5xl font-semibold text-white leading-[1.08] tracking-tight mb-5">
          drop a file.<br />share only if you want.
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }} className="text-neutral-400 text-lg leading-relaxed max-w-xl mb-8">
          Raise a glass, send a packet, or keep the older desks. Large drops get a warning, not a refusal.
        </motion.p>
        <div className="flex flex-wrap gap-3 mb-12">
          <button onClick={() => navigate('sharehub')} className="inline-flex px-5 py-2.5 rounded-full bg-[#0a84ff] text-white text-sm font-medium hover:bg-[#409cff] transition active:scale-[0.98]">share hub</button>
          <button onClick={() => navigate('abacus')} className="inline-flex px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-200 transition active:scale-[0.98]">lay a slab</button>
          <button onClick={() => navigate('campanile')} className="inline-flex px-5 py-2.5 rounded-full bg-[#0a84ff] text-white text-sm font-medium hover:bg-[#409cff] transition active:scale-[0.98]">open the tower</button>
          <button onClick={() => navigate('reliquary')} className="inline-flex px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-200 transition active:scale-[0.98]">file a receipt</button>
          <button onClick={() => navigate('sacristy')} className="inline-flex px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-200 transition active:scale-[0.98]">open receipts</button>
          <button onClick={() => navigate('tympanum')} className="inline-flex px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-200 transition active:scale-[0.98]">raise a field</button>
          <button onClick={() => navigate('lorgnette')} className="inline-flex px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-200 transition active:scale-[0.98]">raise a glass</button>
          <button onClick={() => navigate('monocle')} className="inline-flex px-5 py-2.5 rounded-full bg-[#0a84ff] text-white text-sm font-medium hover:bg-[#409cff] transition active:scale-[0.98]">open the board</button>
          <button onClick={() => navigate('reticule')} className="inline-flex px-5 py-2.5 rounded-full glass text-neutral-300 text-sm font-medium hover:text-white transition">file a reticule</button>
          <button onClick={() => navigate('courier')} className="inline-flex px-5 py-2.5 rounded-full glass text-neutral-300 text-sm font-medium hover:text-white transition">send a packet</button>
          <button onClick={() => navigate('tally')} className="inline-flex px-5 py-2.5 rounded-full glass text-neutral-300 text-sm font-medium hover:text-white transition">stamp a receipt</button>
          <button onClick={() => navigate('gathering')} className="inline-flex px-5 py-2.5 rounded-full glass text-neutral-300 text-sm font-medium hover:text-white transition">file a gathering</button>
          <button onClick={() => navigate('deckle')} className="inline-flex px-5 py-2.5 rounded-full glass text-neutral-300 text-sm font-medium hover:text-white transition">lay a deckle</button>
          <button onClick={() => navigate('lantern')} className="inline-flex px-5 py-2.5 rounded-full glass text-neutral-300 text-sm font-medium hover:text-white transition">set a lantern</button>
          <button onClick={() => navigate('haversack')} className="inline-flex px-5 py-2.5 rounded-full glass text-neutral-300 text-sm font-medium hover:text-white transition">hang a haversack</button>
          <button onClick={() => navigate('vault')} className="inline-flex px-5 py-2.5 rounded-full glass text-neutral-300 text-sm font-medium hover:text-white transition">open vault</button>
          <a href="#features" className="inline-flex px-5 py-2.5 rounded-full glass text-neutral-300 text-sm font-medium hover:text-white transition">see features</a>
        </div>
      </div>
    </section>
  );
}
