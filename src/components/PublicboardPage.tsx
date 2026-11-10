import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, publishLocalFile, shareUrls, type CloudMeta } from '../lib/cloudShare';

function formatSize(n: number) {
  if (!n) return '0 B';
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / 1024 / 1024).toFixed(1) + ' MB';
  return (n / 1024 / 1024 / 1024).toFixed(1) + ' GB';
}

export default function PublicboardPage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [dropping, setDropping] = useState(false);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [caption, setCaption] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const rows = await listPublicShares(36);
    setShares(rows);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onFiles(files: FileList | File[]) {
    const arr = Array.from(files || []);
    if (!arr.length) return;
    setBusy(true);
    setWarn(null);
    let anyLarge = false;
    for (const file of arr) {
      if (file.size > 40 * 1024 * 1024) anyLarge = true;
      const res = await publishLocalFile(file, { caption: caption.trim() || undefined });
      if (!res.ok) {
        setWarn(res.error || 'could not share');
        break;
      }
    }
    if (anyLarge) setWarn((w) => w || 'large drop. the browser may feel slow while it sends. no hard limit.');
    setBusy(false);
    setCaption('');
    await load();
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDropping(false);
    if (e.dataTransfer.files?.length) onFiles(e.dataTransfer.files);
  }

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 20 }}
          className="text-center mb-10"
        >
          <p className="text-[#0A84FF] text-sm font-medium tracking-wide mb-2">public board</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mb-3">what others have shared</h1>
          <p className="text-neutral-400 text-lg max-w-xl mx-auto">
            Recent public drops from the database. Drag files here to share instantly — large ones are warned, never refused. Every link unfurls a polished Discord card.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 100, damping: 22, delay: 0.08 }}
          onDragOver={(e) => { e.preventDefault(); setDropping(true); }}
          onDragLeave={() => setDropping(false)}
          onDrop={onDrop}
          className={`glass rounded-[28px] p-6 mb-10 border-2 border-dashed transition-colors ${
            dropping ? 'border-[#0A84FF]/60 bg-[#0A84FF]/5' : 'border-white/10'
          }`}
        >
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <label className="flex-1 w-full cursor-pointer">
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && onFiles(e.target.files)}
              />
              <div className="text-center py-6 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] transition">
                <p className="text-white font-medium">drop files or click to share</p>
                <p className="text-xs text-neutral-500 mt-1">multiple allowed · lands in storage + public_shares</p>
              </div>
            </label>
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="optional shared caption"
              className="w-full sm:w-64 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-neutral-500 outline-none focus:border-[#0A84FF]/40"
            />
          </div>
          <AnimatePresence>
            {busy && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center text-sm text-[#0A84FF] mt-4">
                sharing…
              </motion.p>
            )}
            {warn && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-xs text-amber-300/90 mt-3">
                {warn}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {loading ? (
          <div className="text-center text-neutral-500 text-sm">opening the board…</div>
        ) : shares.length === 0 ? (
          <div className="text-center text-neutral-500">nothing public yet. be the first drop.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {shares.map((s, i) => {
                const urls = shareUrls(s.id);
                const isImage = (s.type || '').startsWith('image/');
                return (
                  <motion.a
                    key={s.id}
                    href={urls.app}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03, type: 'spring', stiffness: 120, damping: 20 }}
                    whileHover={{ y: -4 }}
                    className="glass rounded-[24px] overflow-hidden group block"
                  >
                    {isImage && s.url ? (
                      <div className="aspect-video bg-black/40 overflow-hidden">
                        <img src={s.url} alt="" className="w-full h-full object-cover group-hover:scale-[1.03] transition duration-500" />
                      </div>
                    ) : (
                      <div className="aspect-video bg-gradient-to-br from-white/5 to-transparent flex items-center justify-center text-4xl text-neutral-600">
                        📄
                      </div>
                    )}
                    <div className="p-4">
                      <p className="text-white text-sm font-medium truncate">{s.name || 'untitled'}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">{formatSize(s.size)} · {s.downloads || 0} opens</p>
                      {s.caption && <p className="text-xs text-neutral-400 mt-2 line-clamp-2">{s.caption}</p>}
                    </div>
                  </motion.a>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
