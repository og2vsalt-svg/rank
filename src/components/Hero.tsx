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
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('softlumenpavilion')} className="px-5 py-2.5 rounded-full bg-[#AF52DE] text-white text-sm font-medium hover:bg-[#c06ae8] transition">softlumenpavilion</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('softlumenharbor')} className="px-5 py-2.5 rounded-full bg-[#5AC8FA] text-black text-sm font-medium hover:bg-[#6ed0fb] transition">softlumenharbor</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('softlumentide')} className="px-5 py-2.5 rounded-full bg-[#0A84FF] text-white text-sm font-medium hover:bg-[#409CFF] transition">softlumentide</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('softlumenmeadow')} className="px-5 py-2.5 rounded-full bg-[#34C759] text-white text-sm font-medium hover:bg-[#48d46a] transition">softlumenmeadow</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('softlumenvault')} className="px-5 py-2.5 rounded-full bg-[#0A84FF] text-white text-sm font-medium hover:bg-[#409CFF] transition">softlumenvault</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('softlumenfalls')} className="px-5 py-2.5 rounded-full bg-[#64D2FF] text-black text-sm font-medium hover:bg-[#7ad8ff] transition">softlumenfalls</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('softlumenjournal')} className="px-5 py-2.5 rounded-full bg-[#A78BFA] text-white text-sm font-medium hover:bg-[#b79bfc] transition">softlumenjournal</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('softlumenprism')} className="px-5 py-2.5 rounded-full bg-[#5EEAD4] text-black text-sm font-medium hover:bg-[#6ef0dc] transition">softlumenprism</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('quietworkshop')} className="px-5 py-2.5 rounded-full bg-[#FF9F0A] text-black text-sm font-medium hover:bg-[#ffb340] transition">quietworkshop</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('vault')} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-200 transition">open vault</motion.button>
          <a href="#features" className="px-5 py-2.5 rounded-full glass text-neutral-300 text-sm font-medium hover:text-white transition">all desks</a>
        </div>
      </div>
    </section>
  );
}
