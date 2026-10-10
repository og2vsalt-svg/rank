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
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-[#0A84FF] text-sm font-medium mb-4 tracking-wide"
        >
          private file hosting
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-4xl sm:text-6xl font-semibold text-white leading-[1.05] tracking-tight mb-5"
        >
          drop a file.<br />share only if you want.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.14 }}
          className="text-neutral-400 text-lg leading-relaxed max-w-xl mb-9 mx-auto sm:mx-0"
        >
          Batch drops, quiet galleries, framed notes, and dozens of specialized desks. Files land in the database. Discord cards on every share. Large drops get a warning, never a refusal. Human-crafted, Apple-smooth motion.
        </motion.p>
        <div className="flex flex-wrap gap-3 justify-center sm:justify-start mb-10">
          <button onClick={() => navigate('harbor')} className="inline-flex px-5 py-2.5 rounded-full bg-[#0A84FF] text-white text-sm font-medium hover:bg-[#409CFF] transition active:scale-[0.98]">harbor</button>
          <button onClick={() => navigate('quay')} className="inline-flex px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-200 transition active:scale-[0.98]">quay</button>
          <button onClick={() => navigate('catalog')} className="inline-flex px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-200 transition active:scale-[0.98]">catalog</button>
          <button onClick={() => navigate('gallery')} className="inline-flex px-5 py-2.5 rounded-full glass text-neutral-300 text-sm font-medium hover:text-white transition">gallery</button>
          <button onClick={() => navigate('vault')} className="inline-flex px-5 py-2.5 rounded-full glass text-neutral-300 text-sm font-medium hover:text-white transition">vault</button>
          <a href="#features" className="inline-flex px-5 py-2.5 rounded-full glass text-neutral-300 text-sm font-medium hover:text-white transition">features</a>
        </div>
      </div>
    </section>
  );
}
