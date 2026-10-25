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
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('quietatlas')} className="px-5 py-2.5 rounded-full bg-[#5EEAD4] text-black text-sm font-medium hover:bg-[#6ef0dc] transition">quietatlas</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('softstillroom')} className="px-5 py-2.5 rounded-full bg-[#A78BFA] text-white text-sm font-medium hover:bg-[#b79bfc] transition">softstillroom</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('softlumenweave')} className="px-5 py-2.5 rounded-full bg-[#64D2FF] text-black text-sm font-medium hover:bg-[#7ad8ff] transition">softlumenweave</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('softcove')} className="px-5 py-2.5 rounded-full bg-[#64D2FF] text-black text-sm font-medium hover:bg-[#7ad8ff] transition">softcove</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('softgallery')} className="px-5 py-2.5 rounded-full bg-[#64D2FF] text-black text-sm font-medium hover:bg-[#7ad8ff] transition">softgallery</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('quietwhisper')} className="px-5 py-2.5 rounded-full bg-[#A78BFA] text-white text-sm font-medium hover:bg-[#b79bfc] transition">quietwhisper</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('quietledger')} className="px-5 py-2.5 rounded-full bg-[#0A84FF] text-white text-sm font-medium hover:bg-[#409CFF] transition">quietledger</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('softauroratide')} className="px-5 py-2.5 rounded-full bg-[#5EEAD4] text-black text-sm font-medium hover:bg-[#6ef0dc] transition">softauroratide</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('quietnest')} className="px-5 py-2.5 rounded-full bg-[#AF52DE] text-white text-sm font-medium hover:bg-[#bf6ae5] transition">quietnest</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('softemberlight')} className="px-5 py-2.5 rounded-full bg-[#FF6B35] text-white text-sm font-medium hover:bg-[#ff7a4a] transition">softemberlight</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('quiethorizon')} className="px-5 py-2.5 rounded-full bg-[#64D2FF] text-black text-sm font-medium hover:bg-[#7ad8ff] transition">quiethorizon</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('softarchive')} className="px-5 py-2.5 rounded-full bg-[#AF52DE] text-white text-sm font-medium hover:bg-[#bf6ae5] transition">softarchive</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('quietmosaic')} className="px-5 py-2.5 rounded-full bg-[#5EEAD4] text-black text-sm font-medium hover:bg-[#6ef0dc] transition">quietmosaic</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('softstillwater')} className="px-5 py-2.5 rounded-full bg-[#64D2FF] text-black text-sm font-medium hover:bg-[#7ad8ff] transition">softstillwater</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('softgleam')} className="px-5 py-2.5 rounded-full bg-[#FFE5B4] text-black text-sm font-medium hover:bg-[#fff0c8] transition">softgleam</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('softstill')} className="px-5 py-2.5 rounded-full bg-[#64D2FF] text-black text-sm font-medium hover:bg-[#7ad8ff] transition">softstill</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('softlantern')} className="px-5 py-2.5 rounded-full bg-[#FFD60A] text-black text-sm font-medium hover:bg-[#ffe14a] transition">softlantern</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('softfilament')} className="px-5 py-2.5 rounded-full bg-[#FF9F0A] text-black text-sm font-medium hover:bg-[#ffb340] transition">softfilament</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('softaurora')} className="px-5 py-2.5 rounded-full bg-[#5EEAD4] text-black text-sm font-medium hover:bg-[#6ef0dc] transition">softaurora</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('chronicle')} className="px-5 py-2.5 rounded-full bg-[#0A84FF] text-white text-sm font-medium hover:bg-[#409CFF] transition">chronicle</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('softlumenhearth')} className="px-5 py-2.5 rounded-full bg-[#FF6B35] text-white text-sm font-medium hover:bg-[#ff7a4a] transition">softlumenhearth</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('softharbor')} className="px-5 py-2.5 rounded-full bg-[#64D2FF] text-black text-sm font-medium hover:bg-[#7ad8ff] transition">softharbor</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('softnexus')} className="px-5 py-2.5 rounded-full bg-[#5EEAD4] text-black text-sm font-medium hover:bg-[#6ef0dc] transition">softnexus</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('quietbeam')} className="px-5 py-2.5 rounded-full bg-[#5EEAD4] text-black text-sm font-medium hover:bg-[#6ef0dc] transition">quietbeam</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('softwave')} className="px-5 py-2.5 rounded-full bg-[#64D2FF] text-black text-sm font-medium hover:bg-[#7ad8ff] transition">softwave</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('softripple')} className="px-5 py-2.5 rounded-full bg-[#64D2FF] text-black text-sm font-medium hover:bg-[#7ad8ff] transition">softripple</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('softhelix')} className="px-5 py-2.5 rounded-full bg-[#BF5AF2] text-white text-sm font-medium hover:bg-[#c86bf5] transition">softhelix</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('softorbit')} className="px-5 py-2.5 rounded-full bg-[#BF5AF2] text-white text-sm font-medium hover:bg-[#c86bf5] transition">softorbit</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('softlumen')} className="px-5 py-2.5 rounded-full bg-[#64D2FF] text-black text-sm font-medium hover:bg-[#7ad8ff] transition">softlumen</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('quietpulse')} className="px-5 py-2.5 rounded-full bg-[#5EEAD4] text-black text-sm font-medium hover:bg-[#6ef0dc] transition">quietpulse</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('lumenpath')} className="px-5 py-2.5 rounded-full bg-[#FF9F0A] text-black text-sm font-medium hover:bg-[#ffb340] transition">lumenpath</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('starfield')} className="px-5 py-2.5 rounded-full bg-[#64D2FF] text-black text-sm font-medium hover:bg-[#7ad8ff] transition">starfield</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('glowveil')} className="px-5 py-2.5 rounded-full bg-[#A78BFA] text-white text-sm font-medium hover:bg-[#b79bfc] transition">glowveil</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('vault')} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-200 transition">open vault</motion.button>
          <a href="#features" className="px-5 py-2.5 rounded-full glass text-neutral-300 text-sm font-medium hover:text-white transition">all desks</a>
        </div>
      </div>
    </section>
  );
}
