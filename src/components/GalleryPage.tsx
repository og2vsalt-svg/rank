import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { listPublicShares, publishLocalFile, type CloudMeta } from '../lib/cloudShare';
import Navbar from './Navbar';
import { useRouter } from './Router';

function pretty(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1048576) return Math.round(n / 1024) + ' KB';
  return (n / 1048576).toFixed(1) + ' MB';
}

export default function GalleryPage() {
  const { navigate } = useRouter();
  const [items, setItems] = useState<CloudMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [warn, setWarn] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listPublicShares(36).then((rows) => {
      setItems(rows);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const onPick = async (list: FileList | null) => {
    if (!list || !list[0]) return;
    const file = list[0];
    setUploading(true);
    setWarn(file.size > 50 * 1024 * 1024 ? 'Large file. Upload may take a moment — no hard limit.' : '');
    const res = await publishLocalFile(file, { caption: 'shared from gallery' });
    setUploading(false);
    if (res.ok && res.id) {
      // refresh a bit
      const fresh = await listPublicShares(36);
      setItems(fresh);
      navigate('s', res.id);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-24 pb-16 px-4 sm:px-6 max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0a84ff] text-sm font-medium mb-2">gallery</p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white mb-2">recent public shares</h1>
          <p className="text-neutral-400 mb-8 max-w-xl">A living grid of files people have shared. Hover for detail. Drop or pick to add yours — Discord gets a clean card.</p>
        </motion.div>

        <div className="flex justify-end mb-6">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-200 active:scale-95 transition disabled:opacity-60"
          >
            {uploading ? 'sending…' : 'add a file'}
          </button>
          <input ref={fileRef} type="file" className="hidden" onChange={(e) => onPick(e.target.files)} />
        </div>

        {warn && <p className="text-amber-300 text-sm mb-4 text-center">{warn}</p>}

        {loading ? (
          <div className="grid place-items-center py-20 text-neutral-500">loading shares…</div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 text-neutral-500">nothing public yet. be the first.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            <AnimatePresence>
              {items.map((item, i) => (
                <motion.button
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ delay: i * 0.02, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ scale: 1.025, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('s', item.id)}
                  className="group glass rounded-2xl overflow-hidden text-left apple-card aspect-[4/5] relative"
                >
                  {item.type.startsWith('image/') && item.fileUrl ? (
                    <img src={item.fileUrl} alt="" className="w-full h-2/3 object-cover" />
                  ) : (
                    <div className="h-2/3 grid place-items-center text-4xl opacity-60 bg-white/5">📄</div>
                  )}
                  <div className="p-3 absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent">
                    <p className="text-white text-sm font-medium truncate">{item.name || 'untitled'}</p>
                    <p className="text-neutral-400 text-xs">{pretty(item.size)} · {item.downloads || 0} views</p>
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
