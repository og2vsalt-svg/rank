import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, shareUrls, type CloudMeta } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function GazetteerPage() {
  const [rows, setRows] = useState<CloudMeta[]>([]);
  const [err, setErr] = useState('');
  const { navigate } = useRouter();

  useEffect(() => {
    listPublicShares(36)
      .then(setRows)
      .catch(() => setErr('could not read the public table'));
  }, []);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 240, damping: 26 }}>
          <p className="text-[#0a84ff] text-sm mb-2">gazetteer</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a map of live public drops.</h1>
          <p className="text-neutral-400 text-sm mb-8">not your vault. just what is already sitting in the share db.</p>
          {err && <p className="text-xs text-red-400 mb-4">{err}</p>}
          <div className="grid sm:grid-cols-2 gap-3">
            {rows.map((r, i) => (
              <motion.button
                key={r.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02, type: 'spring', stiffness: 260, damping: 24 }}
                onClick={() => navigate('share', r.id)}
                className="text-left glass rounded-3xl p-5 hover:bg-white/5 transition"
              >
                <p className="text-white text-sm truncate">{r.name}</p>
                <p className="text-[11px] text-neutral-500 mt-1">{r.type} · {Math.round((r.size || 0) / 1024)} kb</p>
                <p className="text-[11px] text-neutral-600 mt-2 break-all">{shareUrls(r.id).embed}</p>
              </motion.button>
            ))}
          </div>
          {!rows.length && !err && <p className="text-sm text-neutral-500">quiet out here for now.</p>}
        </motion.div>
      </div>
    </div>
  );
}
