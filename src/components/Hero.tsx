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
          Quiet desks for multi-file drops, sequenced notes, living galleries, and polished embeds. Soft size warnings only — no hard limits. Apple-style springs on frosted glass.
        </motion.p>
        <div className="flex flex-wrap gap-3 justify-center">
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('lumenatelier')} className="px-7 py-3 rounded-full bg-[#FF9F0A] text-black text-sm font-medium hover:opacity-90 transition shadow-lg">lumen atelier</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('lumenpalette')} className="px-7 py-3 rounded-full bg-[#0A84FF] text-white text-sm font-medium hover:opacity-90 transition shadow-lg">lumen palette</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('aetherarchive')} className="px-7 py-3 rounded-full bg-[#BF5AF2] text-white text-sm font-medium hover:opacity-90 transition shadow-lg">aether archive</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('quietprism')} className="px-7 py-3 rounded-full bg-[#64D2FF] text-black text-sm font-medium hover:opacity-90 transition shadow-lg">quiet prism</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('velvetcascade')} className="px-7 py-3 rounded-full bg-[#30D158] text-black text-sm font-medium hover:opacity-90 transition shadow-lg">velvet cascade</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('lumenwhisper')} className="px-7 py-3 rounded-full bg-[#FFD60A] text-black text-sm font-medium hover:opacity-90 transition shadow-lg">lumen whisper</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('prismgallery')} className="px-7 py-3 rounded-full bg-white/10 text-white text-sm font-medium hover:bg-white/15 transition">prism gallery</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('centralvault')} className="px-7 py-3 rounded-full bg-white/5 text-neutral-300 text-sm font-medium hover:bg-white/10 transition">central vault</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('directory')} className="px-6 py-2.5 rounded-full bg-white/5 text-neutral-300 text-sm font-medium hover:bg-white/10 transition">all desks</motion.button>
        </div>
      </div>
    </section>
  );
}
