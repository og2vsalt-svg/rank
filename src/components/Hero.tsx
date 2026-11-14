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
          Local vault. Quiet Album for image-focused drops with previews, Quiet Nadir for deep still drops, Quiet Horizon for files along a soft line, Quiet Glen for floating glass leaves, Quiet Orchard for growing glass trees, Quiet Notebook for multi-entry pages, Quiet Scriptorium for composing notes, Lumen Hub for clean central drops, Quiet Vista for flowing recent shares, and dozens more specialized desks. Professional Discord embeds on every link. Soft size warnings only. No hard limits. Sleek Apple-style spring animations.
        </motion.p>
        <div className="flex flex-wrap gap-3 justify-center">
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('quietalbum')} className="px-6 py-2.5 rounded-full bg-[#AF52DE] text-white text-sm font-medium hover:bg-[#c084fc] transition">quiet album</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('quietnadir')} className="px-6 py-2.5 rounded-full bg-[#3A3A3C] text-white text-sm font-medium hover:bg-[#48484A] transition">quiet nadir</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('quiethorizon')} className="px-6 py-2.5 rounded-full bg-[#5AC8FA] text-black text-sm font-medium hover:bg-[#7ad4ff] transition">quiet horizon</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('quietglen')} className="px-6 py-2.5 rounded-full bg-[#5AC8FA] text-black text-sm font-medium hover:bg-[#7ad4ff] transition">quiet glen</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('lumenhub')} className="px-6 py-2.5 rounded-full bg-[#0A84FF] text-white text-sm font-medium hover:bg-[#3a9aff] transition">lumen hub</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('quietorchard')} className="px-6 py-2.5 rounded-full bg-[#5AC8FA] text-black text-sm font-medium hover:bg-[#7ad4ff] transition">quiet orchard</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('quietnotebook')} className="px-6 py-2.5 rounded-full bg-[#0A84FF] text-white text-sm font-medium hover:bg-[#3a9aff] transition">quiet notebook</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('quietscriptorium')} className="px-6 py-2.5 rounded-full bg-[#AF52DE] text-white text-sm font-medium hover:bg-[#c084fc] transition">quiet scriptorium</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('vault')} className="px-6 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-100 transition">open vault</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('quietvista')} className="px-6 py-2.5 rounded-full bg-[#5AC8FA] text-black text-sm font-medium hover:bg-[#7ad4ff] transition">quiet vista</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('directory')} className="px-6 py-2.5 rounded-full bg-white/10 text-white text-sm font-medium hover:bg-white/15 transition">browse desks</motion.button>
        </div>
      </div>
    </section>
  );
}
