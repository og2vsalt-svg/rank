import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publishLocalFile, shareUrls, listPublicShares, type CloudMeta } from '../lib/cloudShare';

export default function QuietForgePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#0A84FF');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done'>('idle');
  const [results, setResults] = useState<{ id: string; name: string; embed: string; warn?: string | null }[]>([]);
  const [recent, setRecent] = useState<CloudMeta[]>([]);
  const [warn, setWarn] = useState<string | null>(null);

  useEffect(() => {
    listPublicShares(16).then(setRecent).catch(() => {});
  }, []);

  const onDrop = useCallback((list: FileList | File[]) => {
    const arr = Array.from(list);
    if (arr.some(f => f.size > 40 * 1024 * 1024)) {
      setWarn('large files detected. the browser may feel slow while uploading. no hard limit.');
    } else {
      setWarn(null);
    }
    setFiles(prev => [...prev, ...arr]);
    arr.forEach(file => {
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setPreviews(p => ({ ...p, [file.name + file.size]: url }));
      }
    });
    setStatus('idle');
  }, []);

  const shareAll = async () => {
    if (!files.length) return;
    setStatus('uploading');
    const out = [];
    for (const file of files) {
      const res = await publishLocalFile(file, {
        caption: caption || undefined,
        color,
        cardTitle: file.name,
        author: 'rankvault',
        meta: { desk: 'quietforge' },
      });
      if (res.ok && res.id) {
        out.push({
          id: res.id,
          name: file.name,
          embed: shareUrls(res.id).embed,
          warn: res.warn || null,
        });
      }
    }
    setResults(out);
    setFiles([]);
    setPreviews({});
    setStatus('done');
    listPublicShares(16).then(setRecent).catch(() => {});
  };

  return (
    <div className="min-h-screen bg-[#0b0b0d] text-white pt-24 px-5 pb-16">
      <div className="max-w-5xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="text-4xl font-semibold tracking-tight mb-2"
        >
          quiet forge
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.06 }}
          className="text-neutral-400 mb-8 max-w-2xl"
        >
          Drop local files into a calm forge. Live image previews settle into spring-animated frosted glass cards. Batch-publish to the database. Soft size warnings only. Professional Discord embeds on every link.
        </motion.p>

        <div
          className="glass rounded-[28px] p-10 mb-6 text-center cursor-pointer border border-white/10 hover:border-white/20 transition-all"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files) onDrop(e.dataTransfer.files);
          }}
        >
          <input type="file" multiple onChange={(e) => e.target.files && onDrop(e.target.files)} className="hidden" id="forge-file" />
          <label htmlFor="forge-file" className="cursor-pointer block">
            <div className="text-neutral-500 text-sm mb-1">drag files or click</div>
            <div className="text-xs text-neutral-600">no hard limits · soft warnings only</div>
          </label>
        </div>

        {warn && <p className="text-amber-400 text-xs text-center mb-4">{warn}</p>}

        <AnimatePresence>
          {files.length > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0 }} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
              {files.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass rounded-2xl p-4 text-sm overflow-hidden"
                >
                  {previews[f.name + f.size] && (
                    <img src={previews[f.name + f.size]} alt="" className="w-full h-24 object-cover rounded-xl mb-2" />
                  )}
                  <div className="truncate font-medium">{f.name}</div>
                  <div className="text-xs text-neutral-500 mt-1">{(f.size / 1024 / 1024).toFixed(1)} MB</div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="shared caption"
          className="w-full glass rounded-2xl px-4 py-3 text-sm mb-4 outline-none"
        />

        <div className="flex items-center gap-3 mb-6">
          <span className="text-xs text-neutral-400">accent</span>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-10 rounded-full" />
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={shareAll}
          disabled={!files.length || status === 'uploading'}
          className="w-full py-3 rounded-full bg-[#0A84FF] text-white font-medium disabled:opacity-50 mb-10"
        >
          {status === 'uploading' ? 'forging…' : 'publish all to database'}
        </motion.button>

        {results.length > 0 && (
          <div className="mb-10 space-y-3">
            <p className="text-sm font-medium">new shares</p>
            {results.map((r) => (
              <div key={r.id} className="glass rounded-2xl p-4">
                <p className="text-sm">{r.name}</p>
                <p className="text-xs text-neutral-400 break-all mt-1">{r.embed}</p>
                {r.warn && <p className="text-amber-400 text-xs mt-1">{r.warn}</p>}
                <button onClick={() => navigator.clipboard.writeText(r.embed)} className="text-xs text-[#0A84FF] mt-2">copy discord link</button>
              </div>
            ))}
          </div>
        )}

        <div>
          <p className="text-sm font-medium mb-4">recent public</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {recent.map((item) => (
              <motion.a
                key={item.id}
                href={shareUrls(item.id).app}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -2 }}
                className="glass rounded-2xl p-4 block hover:bg-white/[0.06] transition"
              >
                <p className="text-sm truncate">{item.name || 'untitled'}</p>
                <p className="text-xs text-neutral-500 mt-1">{(item.size / 1024).toFixed(0)} KB</p>
              </motion.a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
