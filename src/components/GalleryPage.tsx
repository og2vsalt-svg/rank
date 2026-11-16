import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, shareUrls, type CloudMeta } from '../lib/cloudShare';

export default function GalleryPage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    listPublicShares(36)
      .then(setShares)
      .catch((e) => setErr(e?.message || 'could not load gallery'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        >
          <p className="text-[#0A84FF] text-sm font-medium mb-2 tracking-wide">gallery</p>
          <h1 className="text-4xl font-semibold mb-4 tracking-tight">recent public shares.</h1>
          <p className="text-neutral-400 text-sm mb-8 max-w-xl leading-relaxed">
            A living gallery of files shared through rankvault desks. Each link carries a polished Discord embed. Soft size warnings only elsewhere. No boosting. All prior features remain.
          </p>
          {loading && <p className="text-neutral-500 text-sm">opening gallery…</p>}
          {err && <p className="text-red-400 text-sm mb-4">{err}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {shares.map((s) => {
              const url = shareUrls(s.id).app;
              const isImg = (s.type || '').startsWith('image/');
              return (
                <motion.a
                  key={s.id}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  whileHover={{ y: -4 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className="glass rounded-2xl p-4 block hover:bg-white/[0.07] transition"
                >
                  {isImg && s.fileUrl && (
                    <img src={s.fileUrl} alt="" className="w-full h-32 object-cover rounded-xl mb-3" />
                  )}
                  <p className="text-sm font-medium truncate">{s.name || 'untitled'}</p>
                  <p className="text-xs text-neutral-500 mt-1 truncate">{s.caption || 'shared file'}</p>
                  <p className="text-[10px] text-neutral-600 mt-2">{s.size ? `${(s.size / 1024 / 1024).toFixed(1)} MB` : ''} · {s.downloads || 0} views</p>
                </motion.a>
              );
            })}
          </div>
          {!loading && shares.length === 0 && <p className="text-neutral-500 text-sm mt-8">no public shares yet. drop one from any desk.</p>}
        </motion.div>
      </div>
    </div>
  );
}
