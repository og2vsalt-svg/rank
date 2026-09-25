import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';

const tiles = [
  { to: 'drop', title: 'drop', blurb: 'local file → vault → public link' },
  { to: 'hatch', title: 'hatch', blurb: 'same flow, discord embed copied' },
  { to: 'vault', title: 'vault', blurb: 'the actual file host' },
  { to: 'radar', title: 'radar', blurb: 'usage pulse, no extra limits' },
  { to: 'tome', title: 'tome', blurb: 'write notes into the vault' },
  { to: 'warden', title: 'warden', blurb: 'inspect a share id' },
  { to: 'plaza', title: 'plaza', blurb: 'public board from the db' },
  { to: 'share', title: 'share', blurb: 'open a file by id' },
];

export default function ZenithPage() {
  const { navigate } = useRouter();
  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0a84ff] text-sm mb-2">zenith</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">everything that is not just a vault.</h1>
          <p className="text-neutral-400 mb-10 max-w-xl">file hosting stays the center. these rooms sit around it. no boost stuff. no fake caps. just tools.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {tiles.map((t, i) => (
              <motion.button
                key={t.to}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.35 }}
                onClick={() => navigate(t.to)}
                className="text-left glass rounded-3xl p-5 hover:bg-white/5 transition"
              >
                <p className="font-medium mb-1">{t.title}</p>
                <p className="text-xs text-neutral-500 leading-relaxed">{t.blurb}</p>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
