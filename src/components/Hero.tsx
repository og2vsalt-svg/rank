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
          Browse the gallery, frame a vignette, leave a word in the oratory, arrange a collection in the atelier, drop on the dresser, or keep the older desks. Large drops get a warning, not a refusal.
        </motion.p>
        <div className="flex flex-wrap gap-3 mb-12">
          <button onClick={() => navigate('dresser')} className="inline-flex px-5 py-2.5 rounded-full bg-[#0a84ff] text-white text-sm font-medium hover:bg-[#409cff] transition active:scale-[0.98]">dresser</button>
          <button onClick={() => navigate('conduit')} className="inline-flex px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-200 transition active:scale-[0.98]">conduit</button>
          <button onClick={() => navigate('studio')} className="inline-flex px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-200 transition active:scale-[0.98]">open studio</button>
          <button onClick={() => navigate('atelier')} className="inline-flex px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-200 transition active:scale-[0.98]">atelier</button>
          <button onClick={() => navigate('vignette')} className="inline-flex px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-200 transition active:scale-[0.98]">vignette</button>
          <button onClick={() => navigate('oratory')} className="inline-flex px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-200 transition active:scale-[0.98]">oratory</button>
          <button onClick={() => navigate('gallery')} className="inline-flex px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-200 transition active:scale-[0.98]">open gallery</button>
          <button onClick={() => navigate('sharehub')} className="inline-flex px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-200 transition active:scale-[0.98]">share hub</button>
          <button onClick={() => navigate('canvas')} className="inline-flex px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-200 transition active:scale-[0.98]">open canvas</button>
          <button onClick={() => navigate('reliquary')} className="inline-flex px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-200 transition active:scale-[0.98]">reliquary</button>
          <button onClick={() => navigate('vault')} className="inline-flex px-5 py-2.5 rounded-full glass text-neutral-300 text-sm font-medium hover:text-white transition">open vault</button>
          <a href="#features" className="inline-flex px-5 py-2.5 rounded-full glass text-neutral-300 text-sm font-medium hover:text-white transition">see features</a>
        </div>
      </div>
    </section>
  );
}
