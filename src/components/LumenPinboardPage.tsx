import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { listPublicShares, publishLocalFile, shareUrls } from '../lib/cloudShare';

type Pin = {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
  caption?: string | null;
  createdAt?: string;
};

export default function LumenPinboardPage() {
  const [pins, setPins] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done'>('idle');
  const [lastLink, setLastLink] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const list = await listPublicShares(36);
    setPins(list.map((m) => ({
      id: m.id,
      name: m.name || 'untitled',
      type: m.type,
      size: m.size,
      url: m.url,
      caption: m.caption,
      createdAt: m.createdAt,
    })));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const onDrop = (list: FileList | File[]) => {
    setFiles(Array.from(list));
    setStatus('idle');
  };

  const pin = async () => {
    if (!files.length) return;
    setStatus('uploading');
    const file = files[0];
    const res = await publishLocalFile(file, {
      caption: caption || undefined,
      cardTitle: file.name,
      author: 'pinboard',
    });
    if (res.ok && res.id) {
      const urls = shareUrls(res.id);
      setLastLink(urls.embed);
      setStatus('done');
      setCaption('');
      setFiles([]);
      load();
    } else {
      setStatus('idle');
    }
  };

  return (
    <div className="min-h-screen bg-[#050506] text-white pt-24 px-5 pb-20">
      <div className="max-w-5xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="text-5xl font-semibold tracking-tight mb-3"
        >
          lumen pinboard
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.08 }}
          className="text-neutral-400 text-lg mb-10 max-w-2xl"
        >
          Pin a local file to the shared board. It uploads to the database with a polished Discord embed. Soft size warnings only. No hard limits.
        </motion.p>

        <div className="grid lg:grid-cols-[340px_1fr] gap-8">
          <div className="glass rounded-3xl p-6 h-fit">
            <div
              className="border border-dashed border-white/15 rounded-2xl p-6 text-center mb-4 cursor-pointer hover:border-white/30 transition"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files) onDrop(e.dataTransfer.files); }}
            >
              <input type="file" className="hidden" id="pinfile" onChange={(e) => e.target.files && onDrop(e.target.files)} />
              <label htmlFor="pinfile" className="cursor-pointer text-sm text-neutral-400">
                {files.length ? files[0].name : 'drop or choose a file'}
              </label>
            </div>
            {files.some(f => f.size > 40 * 1024 * 1024) && (
              <p className="text-amber-400 text-xs mb-3">large file — browser may feel slow. no hard limit.</p>
            )}
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="optional caption"
              className="w-full bg-white/5 rounded-2xl px-4 py-3 text-sm mb-4 outline-none"
            />
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={pin}
              disabled={!files.length || status === 'uploading'}
              className="w-full py-3 rounded-full bg-[#0A84FF] font-medium disabled:opacity-40"
            >
              {status === 'uploading' ? 'pinning…' : 'pin to board'}
            </motion.button>
            {status === 'done' && lastLink && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 text-xs">
                <p className="text-neutral-400 mb-1">pinned</p>
                <p className="break-all text-[#0A84FF]">{lastLink}</p>
                <button onClick={() => navigator.clipboard.writeText(lastLink)} className="mt-2 text-[#0A84FF]">copy</button>
              </motion.div>
            )}
          </div>

          <div>
            {loading ? (
              <div className="text-neutral-500 text-sm">loading pins…</div>
            ) : (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                <AnimatePresence>
                  {pins.map((p, i) => (
                    <motion.a
                      key={p.id}
                      href={shareUrls(p.id).embed}
                      target="_blank"
                      rel="noreferrer"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03, type: 'spring', stiffness: 120, damping: 18 }}
                      className="glass rounded-2xl p-4 block hover:bg-white/[0.07] transition apple-card"
                    >
                      <div className="text-sm font-medium truncate mb-1">{p.name}</div>
                      <div className="text-xs text-neutral-500 mb-2">
                        {(p.size / 1024 / 1024).toFixed(1)} MB · {p.type.split('/')[0]}
                      </div>
                      {p.caption && <div className="text-xs text-neutral-400 line-clamp-2">{p.caption}</div>}
                    </motion.a>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
