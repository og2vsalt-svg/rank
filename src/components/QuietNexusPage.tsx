import { motion } from 'framer-motion';
import { useRouter } from './Router';
import { useEffect, useState } from 'react';

export default function QuietNexusPage() {
  const { navigate } = useRouter();
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    // Soft fetch of recent public shares if available
    fetch('/api/shelf?limit=6')
      .then(r => r.ok ? r.json() : [])
      .then(data => setRecent(Array.isArray(data) ? data.slice(0, 6) : []))
      .catch(() => {});
  }, []);

  return (
    <div className="mesh min-h-screen pt-24 pb-16 px-5">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="text-center mb-12"
        >
          <p className="text-[#0A84FF] text-sm font-medium tracking-wide mb-3">central hub</p>
          <h1 className="text-4xl sm:text-5xl font-semibold text-white tracking-tight mb-4">quiet nexus</h1>
          <p className="text-neutral-400 text-lg max-w-xl mx-auto">
            A calm center for everything. Drop files, browse recent shares, jump to specialized desks. All prior features remain. Soft warnings only. Professional embeds on every link.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <motion.div
            whileHover={{ y: -4 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="glass apple-card p-8 rounded-3xl"
          >
            <h2 className="text-xl font-medium text-white mb-3">quick drop</h2>
            <p className="text-neutral-400 text-sm mb-6">Upload local files straight to the database. No hard limits.</p>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate('lumendrop')}
              className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium"
            >
              open drop
            </motion.button>
          </motion.div>

          <motion.div
            whileHover={{ y: -4 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="glass apple-card p-8 rounded-3xl"
          >
            <h2 className="text-xl font-medium text-white mb-3">browse desks</h2>
            <p className="text-neutral-400 text-sm mb-6">Quiet grove, canopy, helix, atlas, and dozens more.</p>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate('directory')}
              className="px-5 py-2.5 rounded-full bg-white/10 text-white text-sm font-medium hover:bg-white/15"
            >
              directory
            </motion.button>
          </motion.div>
        </div>

        {recent.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="glass p-6 rounded-3xl"
          >
            <h3 className="text-lg font-medium text-white mb-4">recent public</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recent.map((item, i) => (
                <motion.div
                  key={item.id || i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05, type: 'spring' }}
                  className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition cursor-pointer"
                  onClick={() => item.id && navigate('share', item.id)}
                >
                  <p className="text-sm text-white truncate">{item.title || item.name || 'untitled'}</p>
                  <p className="text-xs text-neutral-500 mt-1">{item.type || 'file'}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        <div className="mt-12 text-center">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('home')}
            className="text-sm text-neutral-500 hover:text-white transition"
          >
            back to home
          </motion.button>
        </div>
      </div>
    </div>
  );
}
