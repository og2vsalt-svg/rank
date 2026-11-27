import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { listPublicShares, shareUrls, type CloudMeta } from '../lib/cloudShare';
import { useRouter } from './Router';
import Navbar from './Navbar';

export default function PrismGalleryPage() {
  const { navigate } = useRouter();
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    listPublicShares(36).then((rows) => {
      if (live) {
        setShares(rows);
        setLoading(false);
      }
    });
    return () => {
      live = false;
    };
  }, []);

  const prettySize = (n: number) => {
    if (n < 1024) return n + ' B';
    if (n < 1048576) return Math.round(n / 1024) + ' KB';
    return (n / 1048576).toFixed(1) + ' MB';
  };

  const copyLink = async (id: string) => {
    const url = shareUrls(id).embed;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(id);
      setTimeout(() => setCopied(null), 1400);
    } catch {
      // silent
    }
  };

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7] font-sans antialiased">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 pt-28 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
          className="text-center mb-14"
        >
          <p className="text-[#0A84FF] text-sm tracking-wide mb-3">prism gallery</p>
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight mb-5 leading-[1.02]">
            living shares.<br />soft light.
          </h1>
          <p className="text-neutral-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Recent public drops from the share database. Every link carries a polished Discord embed. Soft size notes only — nothing is refused. Apple-style springs on frosted glass.
          </p>
        </motion.div>

        {loading ? (
          <div className="grid place-items-center py-24 text-sm text-neutral-500">gathering recent light…</div>
        ) : shares.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 text-neutral-500">
            <p>no public shares yet. drop one from any desk and it will appear here.</p>
            <button onClick={() => navigate('centralvault')} className="mt-6 text-sm text-[#0A84FF] hover:underline">
              open central vault
            </button>
          </motion.div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {shares.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.03, type: 'spring', stiffness: 120, damping: 18 }}
                  className="glass rounded-2xl p-5 flex flex-col gap-4 hover:bg-white/[0.04] transition"
                >
                  {s.type?.startsWith('image/') && s.fileUrl && (
                    <img
                      src={s.fileUrl}
                      alt=""
                      className="w-full h-40 object-cover rounded-xl bg-black/20"
                      loading="lazy"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{s.name || 'untitled'}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{prettySize(s.size || 0)}</p>
                    {s.caption && (
                      <p className="text-xs text-neutral-400 mt-2 line-clamp-2">{s.caption}</p>
                    )}
                  </div>
                  <button
                    onClick={() => copyLink(s.id)}
                    className="mt-auto px-4 py-2.5 rounded-full bg-[#0A84FF] text-white text-xs font-medium hover:bg-[#3A9DFF] transition self-start"
                  >
                    {copied === s.id ? 'copied' : 'copy share link'}
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        <div className="text-center mt-16">
          <button
            onClick={() => navigate('home')}
            className="text-sm text-neutral-500 hover:text-white transition"
          >
            ← back home
          </button>
        </div>
      </div>
    </div>
  );
}
