import { motion } from 'framer-motion';
import { useRouter } from './Router';

const DISCORD = 'https://discord.gg/vfhMrPW2Qu';

export default function Hero() {
  const { navigate } = useRouter();
  return (
    <section className="relative pt-28 pb-20 px-5 overflow-hidden">
      <div className="absolute top-20 left-1/4 w-72 h-72 bg-[#0a84ff]/[0.12] rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#af52de]/[0.08] rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-3xl mx-auto">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[#0a84ff] text-sm font-medium mb-4 tracking-wide">file hosting + boosts</motion.p>

        <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="text-4xl sm:text-5xl font-semibold text-white leading-[1.08] tracking-tight mb-5">
          drop a file.<br />keep the grind offloaded.
        </motion.h1>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }} className="text-neutral-400 text-lg leading-relaxed max-w-xl mb-8">
          vault for your stuff. boosts when you want ranks done. same apple-quiet ui, no extra chrome.
        </motion.p>

        <div className="flex flex-wrap gap-3 mb-12">
          <button onClick={() => navigate('vault')} className="inline-flex px-5 py-2.5 rounded-full bg-white text-black font-medium text-sm hover:bg-neutral-200 transition">open vault</button>
          <a href={DISCORD} target="_blank" rel="noopener noreferrer" className="inline-flex px-5 py-2.5 rounded-full border border-white/12 text-neutral-300 text-sm hover:text-white transition">discord</a>
          <a href="#ranks" className="inline-flex px-5 py-2.5 rounded-full glass text-neutral-300 text-sm font-medium hover:text-white transition">see prices</a>
        </div>
      </div>
    </section>
  );
}
