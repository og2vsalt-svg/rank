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
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('softquiethorizon')} className="px-5 py-2.5 rounded-full bg-[#5AC8FA] text-black text-sm font-medium hover:bg-[#6ed0fb] transition">soft quiet horizon</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('softquietobservatory')} className="px-5 py-2.5 rounded-full bg-[#64D2FF] text-black text-sm font-medium hover:bg-[#7ad8ff] transition">soft quiet observatory</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('softquietaurora')} className="px-5 py-2.5 rounded-full bg-[#5AC8FA] text-black text-sm font-medium hover:bg-[#6ed0fb] transition">soft quiet aurora</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('softquietchamber')} className="px-5 py-2.5 rounded-full bg-[#5AC8FA] text-black text-sm font-medium hover:bg-[#6ed0fb] transition">soft quiet chamber</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('quietlumenbridge')} className="px-5 py-2.5 rounded-full bg-[#5AC8FA] text-black text-sm font-medium hover:bg-[#6ed0fb] transition">quiet lumen bridge</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('softquiettide')} className="px-5 py-2.5 rounded-full bg-[#5AC8FA] text-black text-sm font-medium hover:bg-[#6ed0fb] transition">soft quiet tide</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('softquietripple')} className="px-5 py-2.5 rounded-full bg-[#5AC8FA] text-black text-sm font-medium hover:bg-[#6ed0fb] transition">soft quiet ripple</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('softquietveil')} className="px-5 py-2.5 rounded-full bg-[#BF5AF2] text-white text-sm font-medium hover:bg-[#c97af5] transition">soft quiet veil</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('softquietcascade')} className="px-5 py-2.5 rounded-full bg-[#5AC8FA] text-black text-sm font-medium hover:bg-[#6ed0fb] transition">soft quiet cascade</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('softglassvault')} className="px-5 py-2.5 rounded-full bg-[#0A84FF] text-white text-sm font-medium hover:bg-[#3a9aff] transition">soft glass vault</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('softcurrentdesk')} className="px-5 py-2.5 rounded-full bg-[#5AC8FA] text-black text-sm font-medium hover:bg-[#6ed0fb] transition">soft current desk</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('softlumenweft')} className="px-5 py-2.5 rounded-full bg-[#5AC8FA] text-black text-sm font-medium hover:bg-[#6ed0fb] transition">soft lumen weft</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('softquiethalo')} className="px-5 py-2.5 rounded-full bg-[#0A84FF] text-white text-sm font-medium hover:bg-[#3a9aff] transition">soft quiet halo</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('softfileharbor')} className="px-5 py-2.5 rounded-full bg-[#5AC8FA] text-black text-sm font-medium hover:bg-[#6ed0fb] transition">soft file harbor</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('softconstellationdesk')} className="px-5 py-2.5 rounded-full bg-[#5AC8FA] text-black text-sm font-medium hover:bg-[#6ed0fb] transition">soft constellation</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('softwhisperdesk')} className="px-5 py-2.5 rounded-full bg-[#BF5AF2] text-white text-sm font-medium hover:bg-[#c97af5] transition">soft whisper</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('quietimageatlas')} className="px-5 py-2.5 rounded-full bg-[#5AC8FA] text-black text-sm font-medium hover:bg-[#6ed0fb] transition">quiet image atlas</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('softlumenshare')} className="px-5 py-2.5 rounded-full bg-[#0A84FF] text-white text-sm font-medium hover:bg-[#3a9aff] transition">soft lumen share</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('softecholedger')} className="px-5 py-2.5 rounded-full bg-[#BF5AF2] text-white text-sm font-medium hover:bg-[#c97af5] transition">soft echo ledger</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('softglassriver')} className="px-5 py-2.5 rounded-full bg-[#5AC8FA] text-black text-sm font-medium hover:bg-[#6ed0fb] transition">soft glass river</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('quietorbitdesk')} className="px-5 py-2.5 rounded-full bg-[#64D2FF] text-black text-sm font-medium hover:bg-[#7ad8ff] transition">quiet orbit desk</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('lumengallery')} className="px-5 py-2.5 rounded-full bg-[#5AC8FA] text-black text-sm font-medium hover:bg-[#6ed0fb] transition">lumen gallery</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('quietprismdesk')} className="px-5 py-2.5 rounded-full bg-[#64D2FF] text-black text-sm font-medium hover:bg-[#7ad8ff] transition">quiet prism desk</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('softquietfold')} className="px-5 py-2.5 rounded-full bg-[#5AC8FA] text-black text-sm font-medium hover:bg-[#6ed0fb] transition">soft quiet fold</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('vault')} className="px-5 py-2.5 rounded-full bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition">open vault</motion.button>
        </div>
      </div>
    </section>
  );
}
