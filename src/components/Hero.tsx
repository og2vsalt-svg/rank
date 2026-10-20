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
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('softripple')} className="px-5 py-2.5 rounded-full bg-[#64D2FF] text-black text-sm font-medium hover:bg-[#7ad8ff] transition">softripple</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('softhelix')} className="px-5 py-2.5 rounded-full bg-[#BF5AF2] text-white text-sm font-medium hover:bg-[#c86bf5] transition">softhelix</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('softorbit')} className="px-5 py-2.5 rounded-full bg-[#BF5AF2] text-white text-sm font-medium hover:bg-[#c86bf5] transition">softorbit</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('softlumen')} className="px-5 py-2.5 rounded-full bg-[#64D2FF] text-black text-sm font-medium hover:bg-[#7ad8ff] transition">softlumen</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('quietpulse')} className="px-5 py-2.5 rounded-full bg-[#5EEAD4] text-black text-sm font-medium hover:bg-[#6ef0dc] transition">quietpulse</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('lumenpath')} className="px-5 py-2.5 rounded-full bg-[#FF9F0A] text-black text-sm font-medium hover:bg-[#ffb340] transition">lumenpath</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('starfield')} className="px-5 py-2.5 rounded-full bg-[#64D2FF] text-black text-sm font-medium hover:bg-[#7ad8ff] transition">starfield</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('glowveil')} className="px-5 py-2.5 rounded-full bg-[#A78BFA] text-white text-sm font-medium hover:bg-[#b79bfc] transition">glowveil</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('vault')} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-200 transition">open vault</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('riverlight')} className="px-5 py-2.5 rounded-full bg-[#5EEAD4] text-black text-sm font-medium hover:bg-[#6ef0dc] transition">riverlight</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('dawnveil')} className="px-5 py-2.5 rounded-full bg-[#FF9F0A] text-black text-sm font-medium hover:bg-[#ffb340] transition">dawnveil</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('petalfield')} className="px-5 py-2.5 rounded-full bg-[#FF9F0A] text-black text-sm font-medium hover:bg-[#ffb340] transition">petalfield</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('glasscurrent')} className="px-5 py-2.5 rounded-full bg-[#64D2FF] text-black text-sm font-medium hover:bg-[#7ad8ff] transition">glasscurrent</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('quietbloom')} className="px-5 py-2.5 rounded-full bg-[#FF9F0A] text-black text-sm font-medium hover:bg-[#ffb340] transition">quietbloom</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('nimbus')} className="px-5 py-2.5 rounded-full bg-[#A78BFA] text-white text-sm font-medium hover:bg-[#b79bfc] transition">nimbus</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('softapple')} className="px-5 py-2.5 rounded-full bg-[#0A84FF] text-white text-sm font-medium hover:bg-[#409CFF] transition">softapple</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('lattice')} className="px-5 py-2.5 rounded-full bg-[#A78BFA] text-white text-sm font-medium hover:bg-[#b79bfc] transition">lattice</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('cosmos')} className="px-5 py-2.5 rounded-full bg-[#5B21B6] text-white text-sm font-medium hover:bg-[#6D28D9] transition">cosmos</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('mistveil')} className="px-5 py-2.5 rounded-full bg-[#A5B4FC] text-black text-sm font-medium hover:bg-[#b8c5fd] transition">mistveil</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('softtide')} className="px-5 py-2.5 rounded-full bg-[#5EEAD4] text-black text-sm font-medium hover:bg-[#6ef0dc] transition">softtide</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('softprism')} className="px-5 py-2.5 rounded-full bg-[#BF5AF2] text-white text-sm font-medium hover:bg-[#c86bf5] transition">soft prism</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('softecho')} className="px-5 py-2.5 rounded-full bg-[#64D2FF] text-black text-sm font-medium hover:bg-[#7ad8ff] transition">soft echo</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('glimmer')} className="px-5 py-2.5 rounded-full bg-[#FFD60A] text-black text-sm font-medium hover:bg-[#ffe066] transition">glimmer</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('cascade')} className="px-5 py-2.5 rounded-full bg-[#30D158] text-black text-sm font-medium hover:bg-[#4adb6c] transition">cascade</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('ripple')} className="px-5 py-2.5 rounded-full bg-[#64D2FF] text-black text-sm font-medium hover:bg-[#7ad8ff] transition">ripple</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('veil')} className="px-5 py-2.5 rounded-full bg-[#AF52DE] text-white text-sm font-medium hover:bg-[#c06ae8] transition">veil</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('pulse')} className="px-5 py-2.5 rounded-full bg-[#FF375F] text-white text-sm font-medium hover:bg-[#ff4d72] transition">pulse</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('luster')} className="px-5 py-2.5 rounded-full bg-[#A78BFA] text-white text-sm font-medium hover:bg-[#b79bfc] transition">luster</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('mirage')} className="px-5 py-2.5 rounded-full bg-[#FF9F0A] text-black text-sm font-medium hover:bg-[#ffb340] transition">mirage</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('canvas')} className="px-5 py-2.5 rounded-full bg-[#0A84FF] text-white text-sm font-medium hover:bg-[#409CFF] transition">canvas</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('nocturne')} className="px-5 py-2.5 rounded-full bg-[#BF5AF2] text-white text-sm font-medium hover:bg-[#c86bf5] transition">nocturne</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('vesper')} className="px-5 py-2.5 rounded-full bg-[#FF9F0A] text-black text-sm font-medium hover:bg-[#ffb340] transition">vesper</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('aurora')} className="px-5 py-2.5 rounded-full bg-[#64D2FF] text-black text-sm font-medium hover:bg-[#7ad8ff] transition">aurora</motion.button>
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
