import { motion } from 'framer-motion';
import { useRouter } from './Router';

export default function Hero() {
  const { navigate } = useRouter();
  return (
    <section className="relative pt-36 pb-32 px-5 overflow-hidden">
      <div className="absolute top-16 left-1/3 w-96 h-96 bg-[#0A84FF]/[0.08] rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[28rem] h-[28rem] bg-[#AF52DE]/[0.04] rounded-full blur-[160px] pointer-events-none" />
      <div className="relative max-w-2xl mx-auto text-center">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 140, damping: 24 }}
          className="text-[#0A84FF] text-sm font-medium mb-6 tracking-wide"
        >
          private file hosting
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 18, delay: 0.04 }}
          className="text-5xl sm:text-6xl font-semibold text-white leading-[1.02] tracking-tight mb-6"
        >
          drop a file.<br />share only if you want.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 80, damping: 20, delay: 0.1 }}
          className="text-neutral-400 text-lg leading-relaxed max-w-lg mb-10 mx-auto"
        >
          Clean multi-file drops, living galleries, quiet notes, code snippets, and polished Discord embeds on every link. Soft size warnings only — no hard limits. Apple-style springs on frosted glass.
        </motion.p>
        <div className="flex flex-wrap gap-3 justify-center">
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('moodatlas')} className="px-7 py-3 rounded-full bg-[#0A84FF] text-white text-sm font-medium hover:bg-[#3A9DFF] transition shadow-lg">mood atlas</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('echonote')} className="px-7 py-3 rounded-full bg-white/10 text-white text-sm font-medium hover:bg-white/15 transition">echo note</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('horizonforge')} className="px-7 py-3 rounded-full bg-white/5 text-neutral-300 text-sm font-medium hover:bg-white/10 transition">horizon forge</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('lumenvault')} className="px-7 py-3 rounded-full bg-white/5 text-neutral-300 text-sm font-medium hover:bg-white/10 transition">lumen vault</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('aetherforge')} className="px-7 py-3 rounded-full bg-white/5 text-neutral-300 text-sm font-medium hover:bg-white/10 transition">aether forge</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('nexusdrop')} className="px-7 py-3 rounded-full bg-white/5 text-neutral-300 text-sm font-medium hover:bg-white/10 transition">nexus drop</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('snippetforge')} className="px-7 py-3 rounded-full bg-white/5 text-neutral-300 text-sm font-medium hover:bg-white/10 transition">snippet forge</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('harbordrop')} className="px-7 py-3 rounded-full bg-white/5 text-neutral-300 text-sm font-medium hover:bg-white/10 transition">harbor drop</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('lumencollection')} className="px-7 py-3 rounded-full bg-[#AF52DE] text-white text-sm font-medium hover:bg-[#C07AE8] transition shadow-lg">lumen collection</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('discordstudio')} className="px-7 py-3 rounded-full bg-white/5 text-neutral-300 text-sm font-medium hover:bg-white/10 transition">discord studio</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('directory')} className="px-6 py-2.5 rounded-full bg-white/5 text-neutral-300 text-sm font-medium hover:bg-white/10 transition">all desks</motion.button>
        </div>
      </div>
    </section>
  );
}
