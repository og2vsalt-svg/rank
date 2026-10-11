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
          Batch drops, quiet galleries, framed notes, and dozens of specialized desks. Files land in the database. Discord cards on every share. Large drops get a warning, never a refusal. Human-crafted, Apple-smooth motion.
        </motion.p>
        <div className="flex flex-wrap gap-3 justify-center sm:justify-start mb-10">
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('studio')} className="inline-flex px-5 py-2.5 rounded-full bg-[#0A84FF] text-white text-sm font-medium hover:bg-[#409CFF] transition">studio</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('canvas')} className="inline-flex px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-200 transition">canvas</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('harbor')} className="inline-flex px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-200 transition">harbor</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('prism')} className="inline-flex px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-200 transition">prism</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('shelf')} className="inline-flex px-5 py-2.5 rounded-full glass text-neutral-300 text-sm font-medium hover:text-white transition">shelf</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('gallery')} className="inline-flex px-5 py-2.5 rounded-full glass text-neutral-300 text-sm font-medium hover:text-white transition">gallery</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('vault')} className="inline-flex px-5 py-2.5 rounded-full glass text-neutral-300 text-sm font-medium hover:text-white transition">vault</motion.button>
          <a href="#features" className="inline-flex px-5 py-2.5 rounded-full glass text-neutral-300 text-sm font-medium hover:text-white transition">features</a>
        </div>
      </div>
    </section>
  );
}
