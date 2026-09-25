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
          a quiet vault for clips, docs, and dumps. preview in place, sort into folders, flip a file public when you need a link. no size lock. just a heads up if the tab might lag. new desks: emberline, driftwood, hinterland.
        </motion.p>

        <div className="flex flex-wrap gap-3 mb-12">
          <button onClick={() => navigate('vault')} className="inline-flex px-5 py-2.5 rounded-full bg-white text-black font-medium text-sm hover:bg-neutral-200 transition">open vault</button>
          <button onClick={() => navigate('drop')} className="inline-flex px-5 py-2.5 rounded-full glass text-neutral-300 text-sm font-medium hover:text-white transition">public drop</button>
          <button onClick={() => navigate('emberline')} className="inline-flex px-5 py-2.5 rounded-full glass text-neutral-300 text-sm font-medium hover:text-white transition">emberline</button>
          <button onClick={() => navigate('driftwood')} className="inline-flex px-5 py-2.5 rounded-full glass text-neutral-300 text-sm font-medium hover:text-white transition">driftwood</button>
          <button onClick={() => navigate('hinterland')} className="inline-flex px-5 py-2.5 rounded-full glass text-neutral-300 text-sm font-medium hover:text-white transition">hinterland</button>
          <a href="#features" className="inline-flex px-5 py-2.5 rounded-full glass text-neutral-300 text-sm font-medium hover:text-white transition">see features</a>
        </div>
      </div>
    </section>
  );
}
