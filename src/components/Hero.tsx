import { motion } from 'framer-motion';
import { useRouter } from './Router';

export default function Hero() {
  const { navigate } = useRouter();
  return (
    <section className="relative pt-28 pb-24 px-5 overflow-hidden">
      <div className="absolute top-16 left-1/3 w-80 h-80 bg-[#0A84FF]/[0.14] rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[28rem] h-[28rem] bg-[#AF52DE]/[0.07] rounded-full blur-[130px] pointer-events-none" />
      <div className="relative max-w-3xl mx-auto text-center sm:text-left">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 140, damping: 20 }}
          className="text-[#0A84FF] text-sm font-medium mb-4 tracking-wide"
        >
          private file hosting
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 18, delay: 0.04 }}
          className="text-4xl sm:text-6xl font-semibold text-white leading-[1.05] tracking-tight mb-5"
        >
          drop a file.<br />share only if you want.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 20, delay: 0.1 }}
          className="text-neutral-400 text-lg leading-relaxed max-w-xl mb-9 mx-auto sm:mx-0"
        >
          Local drops into your vault, cloud shares with professional Discord embeds, galleries, notes, and specialized desks. No hard size limits—only gentle warnings if a large file might feel slow. Sleek, human-crafted interface with Apple-smooth animations.
        </motion.p>
        <div className="flex flex-wrap gap-3 justify-center sm:justify-start mb-10">
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('drop')} className="inline-flex px-5 py-2.5 rounded-full bg-[#0A84FF] text-white text-sm font-medium hover:bg-[#409CFF] transition">drop a file</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('quill')} className="inline-flex px-5 py-2.5 rounded-full glass text-neutral-300 text-sm font-medium hover:text-white transition">quill</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('glimmer')} className="inline-flex px-5 py-2.5 rounded-full glass text-neutral-300 text-sm font-medium hover:text-white transition">glimmer</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('pulse')} className="inline-flex px-5 py-2.5 rounded-full glass text-neutral-300 text-sm font-medium hover:text-white transition">pulse</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('vault')} className="inline-flex px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-200 transition">open vault</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('gallery')} className="inline-flex px-5 py-2.5 rounded-full glass text-neutral-300 text-sm font-medium hover:text-white transition">gallery</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('sharehub')} className="inline-flex px-5 py-2.5 rounded-full glass text-neutral-300 text-sm font-medium hover:text-white transition">shares</motion.button>
          <a href="#features" className="inline-flex px-5 py-2.5 rounded-full glass text-neutral-300 text-sm font-medium hover:text-white transition">all desks</a>
        </div>
      </div>
    </section>
  );
}
