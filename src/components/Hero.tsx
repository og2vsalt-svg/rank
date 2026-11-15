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
          Quiet Glacier for soft icy shards with cool light. Quiet Drop for central multi-file drops. Quiet Atlas for public share maps. Quiet Beacon for activity. Quiet Silk for draped fluid folds. Quiet Flow for staggered spring motion drops. Quiet Codex for sequenced notes with optional files. Quiet Gallery for a visual public archive. Quiet Harbor for still multi-file drops with gentle spring motion. Quiet Prism, Quiet Lattice, Quiet Aether, Quiet Studio, and dozens more specialized desks. Professional Discord embeds on every link. Soft size warnings only. No hard limits. Sleek Apple-style spring animations. All prior features remain fully intact.
        </motion.p>
        <div className="flex flex-wrap gap-3 justify-center">
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('quietglacier')} className="px-6 py-2.5 rounded-full bg-[#5AC8FA] text-black text-sm font-medium hover:bg-[#7ad4ff] transition">quiet glacier</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('quietdrop')} className="px-6 py-2.5 rounded-full bg-[#C7A27C] text-black text-sm font-medium hover:bg-[#d4b48a] transition">quiet drop</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('quietflow')} className="px-6 py-2.5 rounded-full bg-[#5AC8FA] text-black text-sm font-medium hover:bg-[#7ad4ff] transition">quiet flow</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('quietcodex')} className="px-6 py-2.5 rounded-full bg-[#0A84FF] text-white text-sm font-medium hover:bg-[#3a9aff] transition">quiet codex</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('quietgallery')} className="px-6 py-2.5 rounded-full bg-[#5AC8FA] text-black text-sm font-medium hover:bg-[#7ad4ff] transition">quiet gallery</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('quietharbor')} className="px-6 py-2.5 rounded-full bg-[#A78BFA] text-black text-sm font-medium hover:bg-[#c4b5fd] transition">quiet harbor</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('quietprism')} className="px-6 py-2.5 rounded-full bg-[#34D399] text-black text-sm font-medium hover:bg-[#6ee7b7] transition">quiet prism</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('quietstudio')} className="px-6 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-100 transition">quiet studio</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('vault')} className="px-6 py-2.5 rounded-full bg-white/10 text-white text-sm font-medium hover:bg-white/15 transition">open vault</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('directory')} className="px-6 py-2.5 rounded-full bg-white/10 text-white text-sm font-medium hover:bg-white/15 transition">browse desks</motion.button>
        </div>
      </div>
    </section>
  );
}
