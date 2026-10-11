import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';

export default function TimelinePage() {
  const { activity, files } = useVault();
  const recent = [...activity].slice(0, 20);

  return (
    <div className="min-h-screen bg-[#0b0b0d] text-neutral-100">
      <Navbar />
      <main className="max-w-2xl mx-auto px-5 pt-24 pb-20">
        <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-semibold tracking-tight mb-2">
          timeline
        </motion.h1>
        <p className="text-neutral-400 text-sm mb-8">what happened in this vault lately.</p>

        <div className="space-y-3">
          {recent.length === 0 && <p className="text-neutral-500 text-sm">no activity yet. drop a file and it will appear here.</p>}
          {recent.map((e, i) => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex gap-3 text-sm"
            >
              <div className="w-2 h-2 mt-1.5 rounded-full bg-[#0A84FF] shrink-0" />
              <div>
                <div>{e.text}</div>
                <div className="text-xs text-neutral-500">{new Date(e.at).toLocaleString()}</div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 text-xs text-neutral-500">
          {files.length} files currently in the vault. everything stays local until you choose to share.
        </div>
      </main>
    </div>
  );
}
