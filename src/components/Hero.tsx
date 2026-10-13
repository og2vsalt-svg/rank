import { motion } from 'framer-motion';
import { useRouter } from './Router';

export default function Hero() {
  const { navigate } = useRouter();
  return (
    <section className="relative pt-32 pb-28 px-5 overflow-hidden">
      <div className="absolute top-20 left-1/3 w-96 h-96 bg-[#0A84FF]/[0.12] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-8 right-1/4 w-[32rem] h-[32rem] bg-[#AF52DE]/[0.06] rounded-full blur-[140px] pointer-events-none" />
      <div className="relative max-w-3xl mx-auto text-center">
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 22 }}
          className="text-[#0A84FF] text-sm font-medium mb-5 tracking-wide"
        >
          private file hosting
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 18, delay: 0.05 }}
          className="text-4xl sm:text-6xl font-semibold text-white leading-[1.05] tracking-tight mb-6"
        >
          drop a file.<br />share only if you want.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 80, damping: 20, delay: 0.12 }}
          className="text-neutral-400 text-lg leading-relaxed max-w-xl mb-10 mx-auto"
        >
          Local vault. Cloud shares that land in the database with professional Discord embeds on every link. Galleries, notes, and dozens of specialized desks. Large files warned, never refused. Human-crafted Apple-smooth animations.
        </motion.p>
        <div className="flex flex-wrap gap-3 justify-center">
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('vault')} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-200 transition">open vault</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('zephyr')} className="px-5 py-2.5 rounded-full bg-[#64D2FF] text-black text-sm font-medium hover:bg-[#7ad8ff] transition">zephyr</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('serenity')} className="px-5 py-2.5 rounded-full bg-[#30D158] text-black text-sm font-medium hover:bg-[#4adb6c] transition">serenity</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('ember')} className="px-5 py-2.5 rounded-full bg-[#FF6B35] text-white text-sm font-medium hover:bg-[#ff7a4a] transition">ember</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('murmur')} className="px-5 py-2.5 rounded-full bg-[#BF5AF2] text-white text-sm font-medium hover:bg-[#c86bf5] transition">murmur</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('drift')} className="px-5 py-2.5 rounded-full bg-[#64D2FF] text-black text-sm font-medium hover:bg-[#7ad8ff] transition">drift</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('stillwater')} className="px-5 py-2.5 rounded-full bg-[#30D158] text-black text-sm font-medium hover:bg-[#4adb6c] transition">stillwater</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('drop')} className="px-5 py-2.5 rounded-full bg-[#0A84FF] text-white text-sm font-medium hover:bg-[#409CFF] transition">drop a file</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('haven')} className="px-5 py-2.5 rounded-full glass text-neutral-300 text-sm font-medium hover:text-white transition">haven</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('lumen')} className="px-5 py-2.5 rounded-full glass text-neutral-300 text-sm font-medium hover:text-white transition">lumen</motion.button>
          <a href="#features" className="px-5 py-2.5 rounded-full glass text-neutral-300 text-sm font-medium hover:text-white transition">all desks</a>
        </div>
      </div>
    </section>
  );
}
