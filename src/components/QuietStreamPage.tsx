import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publishLocalFile, shareUrls, listPublicShares, type CloudMeta } from '../lib/cloudShare';

export default function QuietStreamPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done'>('idle');
  const [results, setResults] = useState<{ id: string; name: string; embed: string; warn?: string | null }[]>([]);
  const [stream, setStream] = useState<CloudMeta[]>([]);
  const [warn, setWarn] = useState<string | null>(null);

  useEffect(() => {
    listPublicShares(32).then(setStream).catch(() => {});
  }, []);

  const onDrop = useCallback((list: FileList | File[]) => {
    const arr = Array.from(list);
    if (arr.some(f => f.size > 40 * 1024 * 1024)) {
      setWarn('large files detected. the browser may feel slow while uploading. no hard limit.');
    } else {
      setWarn(null);
    }
    setFiles(prev => [...prev, ...arr]);
    setStatus('idle');
  }, []);

  const shareAll = async () => {
    if (!files.length) return;
    setStatus('uploading');
    const out = [];
    for (const file of files) {
      const res = await publishLocalFile(file, {
        caption: 'streamed',
        color: '#0A84FF',
        cardTitle: file.name,
        author: 'rankvault',
        meta: { desk: 'quietstream' },
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
    setStatus('done');
    listPublicShares(32).then(setStream).catch(() => {});
  };

  return (
    <div className="min-h-screen bg-[#0b0b0d] text-white pt-24 px-5 pb-16">
      <div className="max-w-6xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="text-4xl font-semibold tracking-tight mb-2"
        >
          quiet stream
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.06 }}
          className="text-neutral-400 mb-8 max-w-2xl"
        >
          A flowing horizontal stream of recent public shares. Drop local files on the side and watch them join the current. Soft size warnings only. Professional Discord embeds on every link. Human-crafted spring motion.
        </motion.p>

        <div className="grid md:grid-cols-[1fr_280px] gap-6">
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max">
              <AnimatePresence>
                {stream.map((item, i) => (
                  <motion.a
                    key={item.id}
                    href={shareUrls(item.id).app}
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03, type: 'spring', stiffness: 120, damping: 18 }}
                    whileHover={{ y: -4, scale: 1.02 }}
                    className="glass rounded-[24px] p-5 w-64 shrink-0 block hover:bg-white/[0.05] transition"
                  >
                    <p className="text-sm font-medium truncate">{item.name || 'untitled'}</p>
                    <p className="text-xs text-neutral-500 mt-2">{(item.size / 1024).toFixed(0)} KB</p>
                    {item.caption && <p className="text-xs text-neutral-400 mt-2 line-clamp-2">{item.caption}</p>}
                  </motion.a>
                ))}
              </AnimatePresence>
            </div>
          </div>

          <div className="glass rounded-[28px] p-6 h-fit sticky top-28">
            <div
              className="border border-dashed border-white/20 rounded-2xl p-6 text-center cursor-pointer mb-4 hover:border-white/40 transition"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files) onDrop(e.dataTransfer.files);
              }}
            >
              <input type="file" multiple onChange={(e) => e.target.files && onDrop(e.target.files)} className="hidden" id="stream-file" />
              <label htmlFor="stream-file" className="cursor-pointer block text-sm text-neutral-400">
                drop files to join the stream
              </label>
            </div>
            {warn && <p className="text-amber-400 text-xs mb-3">{warn}</p>}
            {files.length > 0 && (
              <div className="space-y-2 mb-4 max-h-40 overflow-auto">
                {files.map((f, i) => (
                  <div key={i} className="text-xs text-neutral-300 truncate">{f.name} · {(f.size / 1024 / 1024).toFixed(1)} MB</div>
                ))}
              </div>
            )}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={shareAll}
              disabled={!files.length || status === 'uploading'}
              className="w-full py-2.5 rounded-full bg-[#0A84FF] text-white text-sm font-medium disabled:opacity-50"
            >
              {status === 'uploading' ? 'streaming…' : 'publish to stream'}
            </motion.button>
            {results.length > 0 && (
              <div className="mt-4 space-y-2">
                {results.map(r => (
                  <div key={r.id} className="text-xs">
                    <p className="truncate">{r.name}</p>
                    <button onClick={() => navigator.clipboard.writeText(r.embed)} className="text-[#0A84FF]">copy link</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
