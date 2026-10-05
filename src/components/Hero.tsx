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
          a quiet vault for clips, docs, and dumps. catfall lowers a file to a name. spirket splices a brief. no size lock. just a heads up if the tab might lag.
        </motion.p>
        <div className="flex flex-wrap gap-3 mb-12">
          <button onClick={() => navigate('forefoot')} className="inline-flex px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-200 transition">store a file</button>
          <button onClick={() => navigate('catfall')} className="inline-flex px-5 py-2.5 rounded-full glass text-neutral-300 text-sm font-medium hover:text-white transition">lower a file</button>
          <button onClick={() => navigate('spirket')} className="inline-flex px-5 py-2.5 rounded-full glass text-neutral-300 text-sm font-medium hover:text-white transition">splice a brief</button>
          <button onClick={() => navigate('kedge')} className="inline-flex px-5 py-2.5 rounded-full glass text-neutral-300 text-sm font-medium hover:text-white transition">set an anchor</button>
          <button onClick={() => navigate('binnacle')} className="inline-flex px-5 py-2.5 rounded-full glass text-neutral-300 text-sm font-medium hover:text-white transition">read the compass</button>
          <button onClick={() => navigate('oakum')} className="inline-flex px-5 py-2.5 rounded-full glass text-neutral-300 text-sm font-medium hover:text-white transition">stuff a seam</button>
          <button onClick={() => navigate('painter')} className="inline-flex px-5 py-2.5 rounded-full glass text-neutral-300 text-sm font-medium hover:text-white transition">tie a painter</button>
          <button onClick={() => navigate('davits')} className="inline-flex px-5 py-2.5 rounded-full glass text-neutral-300 text-sm font-medium hover:text-white transition">hoist</button>
          <button onClick={() => navigate('vault')} className="inline-flex px-5 py-2.5 rounded-full glass text-neutral-300 text-sm font-medium hover:text-white transition">open vault</button>
          <a href="#features" className="inline-flex px-5 py-2.5 rounded-full glass text-neutral-300 text-sm font-medium hover:text-white transition">see features</a>
        </div>
      </div>
    </section>
  );
}
