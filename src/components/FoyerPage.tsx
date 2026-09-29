import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';

const desks = [
  { to: 'parcel', title: 'parcel', blurb: 'one local file into the share db.' },
  { to: 'ingress', title: 'ingress', blurb: 'same path, with a slower-file warning first.' },
  { to: 'palimpsest', title: 'palimpsest', blurb: 'write a note, keep the original name under it.' },
  { to: 'cleat', title: 'cleat', blurb: 'pick the public id before the file lands.' },
  { to: 'vault', title: 'vault', blurb: 'private grid. stays local until you share.' },
  { to: 'ledger', title: 'ledger', blurb: 'recent public drops.' },
  { to: 'plumb', title: 'plumb', blurb: 'look up a live share id.' },
  { to: 'tinderbox', title: 'tinderbox', blurb: 'preview the discord card then light it.' },
];

export default function FoyerPage() {
  const { navigate } = useRouter();
  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-[#0a84ff] text-sm mb-2">foyer</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">not a vault. a front hall.</h1>
          <p className="text-neutral-400 max-w-xl mb-10">
            pick a desk. files can stay private, or go into the share table with a discord card on /s.
            no hard size cap — only a warning when the tab might feel slow.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {desks.map((d, i) => (
              <motion.button
                key={d.to}
                onClick={() => navigate(d.to)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 * i, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="text-left glass rounded-[24px] p-5 hover:bg-white/[0.06] transition-colors"
              >
                <p className="text-white font-medium">{d.title}</p>
                <p className="text-sm text-neutral-400 mt-1">{d.blurb}</p>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
