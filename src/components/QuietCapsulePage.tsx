import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publishLocalFile, shareUrls, listPublicShares, type CloudMeta } from '../lib/cloudShare';
import Navbar from './Navbar';

export default function QuietCapsulePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#FF9500');
  const [unlockDate, setUnlockDate] = useState('');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done'>('idle');
  const [results, setResults] = useState<{ id: string; name: string; embed: string; unlockAt?: string }[]>([]);
  const [recent, setRecent] = useState<CloudMeta[]>([]);
  const [warn, setWarn] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    listPublicShares(12).then(setRecent).catch(() => {});
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const onDrop = useCallback((list: FileList | File[]) => {
    const arr = Array.from(list);
    if (arr.some(f => f.size > 40 * 1024 * 1024)) {
      setWarn('large files detected. the browser may feel slow while uploading. no hard limit.');
    } else setWarn(null);
    setFiles(prev => [...prev, ...arr]);
    setStatus('idle');
  }, []);

  const shareAll = async () => {
    if (!files.length) return;
    setStatus('uploading');
    const unlockAt = unlockDate ? new Date(unlockDate).toISOString() : null;
    const out = [];
    for (const file of files) {
      const res = await publishLocalFile(file, {
        caption: caption || undefined,
        color,
        cardTitle: file.name,
        author: 'rankvault',
        meta: { desk: 'quietcapsule', unlockAt },
      });
      if (res.ok && res.id) {
        out.push({
          id: res.id,
          name: file.name,
          embed: shareUrls(res.id).embed,
          unlockAt: unlockAt || undefined,
        });
      }
    }
    setResults(out);
    setFiles([]);
    setStatus('done');
    listPublicShares(12).then(setRecent).catch(() => {});
  };

  const formatUnlock = (iso?: string | null) => {
    if (!iso) return 'open now';
    const t = +new Date(iso);
    if (t <= now) return 'unlocked';
    const d = Math.floor((t - now) / 1000);
    const h = Math.floor(d / 3600);
    const m = Math.floor((d % 3600) / 60);
    const s = d % 60;
    return `${h}h ${m}m ${s}s`;
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="min-h-screen bg-transparent text-white pt-24 px-5 pb-16">
        <div className="max-w-5xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            className="text-4xl font-semibold tracking-tight mb-2"
          >
            quiet capsule
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-neutral-400 mb-8 max-w-2xl"
          >
            Seal local files into time-locked capsules. Set an unlock moment. They settle in storage and the public record. Soft countdown on frosted glass. Discord embeds on every link. Large drops gently warned, never refused.
          </motion.p>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <label
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); onDrop(e.dataTransfer.files); }}
                className="block rounded-3xl border-2 border-dashed border-white/20 bg-white/5 p-10 text-center cursor-pointer hover:border-white/40 transition"
              >
                <input type="file" multiple className="hidden" onChange={e => e.target.files && onDrop(e.target.files)} />
                <div className="text-lg font-medium mb-1">drop files to seal</div>
                <div className="text-sm text-neutral-500">or click to browse · soft size warnings only</div>
                {warn && <div className="mt-3 text-amber-300 text-sm">{warn}</div>}
              </label>

              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {files.map((f, i) => (
                    <div key={i} className="flex justify-between text-sm bg-white/5 rounded-xl px-3 py-2">
                      <span className="truncate">{f.name}</span>
                      <span className="text-neutral-500">{(f.size / 1024 / 1024).toFixed(1)} MB</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 space-y-4">
                <input
                  type="text"
                  placeholder="shared caption (optional)"
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-white/30"
                />
                <div className="flex gap-4 items-center">
                  <label className="text-sm text-neutral-400">accent</label>
                  <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-12 h-10 rounded-xl bg-transparent border-0" />
                  <label className="text-sm text-neutral-400 ml-4">unlock</label>
                  <input
                    type="datetime-local"
                    value={unlockDate}
                    onChange={e => setUnlockDate(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-2xl px-3 py-2 text-sm outline-none"
                  />
                </div>
                <button
                  onClick={shareAll}
                  disabled={!files.length || status === 'uploading'}
                  className="w-full rounded-2xl bg-white text-black font-medium py-3 disabled:opacity-40 transition hover:scale-[1.01] active:scale-[0.99]"
                >
                  {status === 'uploading' ? 'sealing…' : 'seal & publish'}
                </button>
              </div>

              <AnimatePresence>
                {results.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-3">
                    {results.map(r => (
                      <div key={r.id} className="bg-white/5 rounded-2xl p-4">
                        <div className="font-medium">{r.name}</div>
                        <div className="text-xs text-neutral-500 mt-1">{formatUnlock(r.unlockAt)}</div>
                        <a href={r.embed} className="text-sm text-blue-400 mt-2 inline-block" target="_blank" rel="noreferrer">{r.embed}</a>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div>
              <h2 className="text-lg font-medium mb-4">recent capsules</h2>
              <div className="space-y-3">
                {recent.map(item => (
                  <motion.a
                    key={item.id}
                    href={`/s/${item.id}`}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="block bg-white/5 hover:bg-white/10 rounded-2xl p-4 transition"
                  >
                    <div className="font-medium truncate">{item.name}</div>
                    <div className="text-xs text-neutral-500 mt-1">{formatUnlock(item.unlockAt)}</div>
                  </motion.a>
                ))}
                {recent.length === 0 && <div className="text-neutral-500 text-sm">no public capsules yet</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
