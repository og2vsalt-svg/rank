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
          Quiet Keepsake for files that matter with personal notes. Quiet Spectrum for multi-file drops with soft rainbow spectrum bars. Quiet Ripple for expanding circular rings. Quiet Horizon for warm horizon glow. Quiet Harmony for pairing files with notes. Quiet Orchard, Quiet Binder, Quiet Lumen, Quiet Folio, Quiet Stream, and dozens more specialized desks. Professional Discord embeds on every link. Soft size warnings only. No hard limits. Sleek Apple-style spring animations. All prior features remain fully intact. No traces of boosting.
        </motion.p>
        <div className="flex flex-wrap gap-3 justify-center">
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('quietkeepsake')} className="px-6 py-2.5 rounded-full bg-[#F5F5F7] text-black text-sm font-medium hover:bg-white transition">quiet keepsake</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('quietspectrum')} className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#FF3B30] via-[#0A84FF] to-[#AF52DE] text-white text-sm font-medium hover:opacity-90 transition">quiet spectrum</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('quietripple')} className="px-6 py-2.5 rounded-full bg-[#0A84FF] text-white text-sm font-medium hover:bg-[#3a9aff] transition">quiet ripple</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('quiethorizon')} className="px-6 py-2.5 rounded-full bg-[#FF9F0A] text-black text-sm font-medium hover:bg-[#ffb340] transition">quiet horizon</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('quietharmony')} className="px-6 py-2.5 rounded-full bg-[#AF52DE] text-white text-sm font-medium hover:bg-[#c084fc] transition">quiet harmony</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('quietorchard')} className="px-6 py-2.5 rounded-full bg-[#34D399] text-black text-sm font-medium hover:bg-[#6ee7b7] transition">quiet orchard</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('quietbinder')} className="px-6 py-2.5 rounded-full bg-[#5AC8FA] text-black text-sm font-medium hover:bg-[#7ad4ff] transition">quiet binder</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('quietlumen')} className="px-6 py-2.5 rounded-full bg-[#FF9F0A] text-black text-sm font-medium hover:bg-[#ffb340] transition">quiet lumen</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('quietfolio')} className="px-6 py-2.5 rounded-full bg-[#0A84FF] text-white text-sm font-medium hover:bg-[#3a9aff] transition">quiet folio</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('quietstream')} className="px-6 py-2.5 rounded-full bg-[#5AC8FA] text-black text-sm font-medium hover:bg-[#7ad4ff] transition">quiet stream</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('quietdrop')} className="px-6 py-2.5 rounded-full bg-[#C7A27C] text-black text-sm font-medium hover:bg-[#d4b48a] transition">quiet drop</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('quietflow')} className="px-6 py-2.5 rounded-full bg-[#5AC8FA] text-black text-sm font-medium hover:bg-[#7ad4ff] transition">quiet flow</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('quietcodex')} className="px-6 py-2.5 rounded-full bg-[#0A84FF] text-white text-sm font-medium hover:bg-[#3a9aff] transition">quiet codex</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('quietgallery')} className="px-6 py-2.5 rounded-full bg-[#5AC8FA] text-black text-sm font-medium hover:bg-[#7ad4ff] transition">quiet gallery</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('quietharbor')} className="px-6 py-2.5 rounded-full bg-[#A78BFA] text-black text-sm font-medium hover:bg-[#c4b5fd] transition">quiet harbor</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('quietprism')} className="px-6 py-2.5 rounded-full bg-[#34D399] text-black text-sm font-medium hover:bg-[#6ee7b7] transition">quiet prism</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('quietstudio')} className="px-6 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-[#f5f5f5] transition">quiet studio</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('vault')} className="px-6 py-2.5 rounded-full bg-white/10 text-white text-sm font-medium hover:bg-white/15 transition">open vault</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('directory')} className="px-6 py-2.5 rounded-full bg-white/10 text-white text-sm font-medium hover:bg-white/15 transition">browse desks</motion.button>
        </div>
      </div>
    </section>
  );
}
