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
          Local vault. Multi-file lumen drop, fold, collage, weave, studio, or interactive pulse. Quiet atlas of recent shares. Professional Discord embeds on every link. Specialized desks. Large files warned, never refused.
        </motion.p>
        <div className="flex flex-wrap gap-3 justify-center">
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('vault')} className="px-6 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-100 transition">open vault</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('lumendrop')} className="px-6 py-2.5 rounded-full bg-[#0A84FF] text-white text-sm font-medium hover:bg-[#3a9aff] transition">lumen drop</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('lumenfold')} className="px-6 py-2.5 rounded-full bg-[#AF52DE] text-white text-sm font-medium hover:bg-[#c47ae8] transition">lumen fold</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('lumencollage')} className="px-6 py-2.5 rounded-full bg-white/10 text-white text-sm font-medium hover:bg-white/15 transition">lumen collage</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('quietatlas')} className="px-6 py-2.5 rounded-full bg-white/10 text-white text-sm font-medium hover:bg-white/15 transition">quiet atlas</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('lumenpulse')} className="px-6 py-2.5 rounded-full bg-white/10 text-white text-sm font-medium hover:bg-white/15 transition">lumen pulse</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('quietcascade')} className="px-6 py-2.5 rounded-full bg-white/10 text-white text-sm font-medium hover:bg-white/15 transition">quiet cascade</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('directory')} className="px-6 py-2.5 rounded-full bg-white/10 text-white text-sm font-medium hover:bg-white/15 transition">browse desks</motion.button>
        </div>
      </div>
    </section>
  );
}
