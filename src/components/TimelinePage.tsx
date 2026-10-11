import { useMemo } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';

export default function TimelinePage() {
  const { files, activity } = useVault();
  const recent = useMemo(() => {
    return [...files].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 30);
  }, [files]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-[32px] p-8 mb-8"
        >
          <p className="text-[#0A84FF] text-sm mb-2">timeline</p>
          <h1 className="text-3xl font-semibold tracking-tight">what landed recently</h1>
          <p className="text-neutral-400 text-sm mt-2">a quiet scroll of local and public drops. no size gates. discord cards still unfurl on every share link.</p>
        </motion.div>
        <div className="space-y-3">
          {recent.map((f, i) => (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, type: 'spring', stiffness: 140, damping: 22 }}
              className="glass rounded-2xl px-5 py-4 flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-medium truncate max-w-xs">{f.name}</p>
                <p className="text-xs text-neutral-500">{new Date(f.createdAt).toLocaleString()} · {f.folder}</p>
              </div>
              <span className="text-xs text-neutral-400">{(f.size / 1024).toFixed(0)}kb</span>
            </motion.div>
          ))}
        </div>
        {activity.length > 0 && (
          <div className="mt-10">
            <p className="text-xs text-neutral-500 mb-3">activity</p>
            {activity.slice(0, 8).map((e) => (
              <p key={e.id} className="text-xs text-neutral-400 py-1">{e.text}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
