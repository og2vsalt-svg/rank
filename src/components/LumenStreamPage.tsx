import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { listPublicShares, type CloudMeta, publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function LumenStreamPage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#0A84FF');
  const [uploading, setUploading] = useState(false);
  const [open, setOpen] = useState<CloudMeta | null>(null);

  const load = useCallback(async () => {
    const rows = await listPublicShares(40);
    setShares(rows);
  }, []);

  useEffect(() => { load(); }, [load]);

  const onDrop = (list: FileList | File[]) => setFiles(Array.from(list));

  const upload = async () => {
    if (!files.length) return;
    setUploading(true);
    try {
      const file = files[0];
      await publishLocalFile(file, {
        caption: caption || undefined,
        color,
        cardTitle: file.name,
        author: 'lumenstream',
      });
      setFiles([]);
      setCaption('');
      await load();
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050506] text-white pt-24 px-5 pb-20">
      <div className="max-w-xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="text-4xl font-semibold tracking-tight mb-2"
        >
          lumen stream
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.06 }}
          className="text-neutral-400 mb-8"
        >
          A flowing stream of recent public shares. Drop a local file to join the current. Soft spring animations, frosted glass, professional Discord embeds on every link. Large files warned for slowness only. All prior features preserved.
        </motion.p>

        <div
          className="glass rounded-3xl p-6 mb-8 apple-card"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files) onDrop(e.dataTransfer.files);
          }}
        >
          <input type="file" onChange={(e) => e.target.files && onDrop(e.target.files)} className="hidden" id="stream-file" />
          <label htmlFor="stream-file" className="block text-center text-sm text-neutral-400 cursor-pointer mb-3">
            {files.length ? files[0].name : 'drop or choose a local file to join the stream'}
          </label>
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="optional caption"
            className="w-full bg-transparent outline-none text-sm mb-4"
          />
          <div className="flex items-center gap-3">
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-8 h-8 rounded-full border-0" />
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={upload}
              disabled={!files.length || uploading}
              className="ml-auto px-4 py-1.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40"
            >
              {uploading ? '…' : 'join stream'}
            </motion.button>
          </div>
          {files.some(f => f.size > 40 * 1024 * 1024) && (
            <p className="text-amber-400 text-xs mt-3">large file. upload may feel slow. no hard limit.</p>
          )}
        </div>

        <div className="space-y-4">
          <AnimatePresence>
            {shares.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, type: 'spring', stiffness: 120, damping: 22 }}
                className="glass rounded-3xl overflow-hidden apple-card cursor-pointer"
                onClick={() => setOpen(item)}
              >
                {String(item.type || '').startsWith('image/') && (
                  <img src={item.fileUrl || item.url} alt={item.name} className="w-full max-h-64 object-cover" loading="lazy" />
                )}
                <div className="p-4">
                  <p className="font-medium text-sm">{item.cardTitle || item.name}</p>
                  {item.caption && <p className="text-xs text-neutral-400 mt-1">{item.caption}</p>}
                  <p className="text-[11px] text-neutral-500 mt-2">{item.author || 'anonymous'} · {new Date(item.createdAt || '').toLocaleDateString()}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {shares.length === 0 && <p className="text-neutral-500 text-sm mt-8">stream is calm. drop a file to begin.</p>}

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-6"
              onClick={() => setOpen(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 170, damping: 22 }}
                className="max-w-lg w-full"
                onClick={(e) => e.stopPropagation()}
              >
                {String(open.type || '').startsWith('image/') && (
                  <img src={open.fileUrl || open.url} alt={open.name} className="w-full rounded-3xl mb-4" />
                )}
                <div className="glass rounded-2xl p-5">
                  <p className="font-medium">{open.cardTitle || open.name}</p>
                  {open.caption && <p className="text-sm text-neutral-400 mt-2">{open.caption}</p>}
                  <p className="text-xs text-[#0A84FF] mt-3 break-all">
                    <a href={shareUrls(open.id).embed}>{shareUrls(open.id).embed}</a>
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
