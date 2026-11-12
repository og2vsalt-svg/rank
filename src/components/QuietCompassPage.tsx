import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publishLocalFile, shareUrls, listPublicShares, type CloudMeta } from '../lib/cloudShare';
import Navbar from './Navbar';

export default function QuietCompassPage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done'>('idle');
  const [results, setResults] = useState<{ id: string; name: string; embed: string; warn?: string | null }[]>([]);
  const [q, setQ] = useState('');
  const [type, setType] = useState<'all' | 'image' | 'video' | 'other'>('all');
  const [warn, setWarn] = useState<string | null>(null);

  useEffect(() => {
    listPublicShares(48).then(setShares).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    const s = q.toLowerCase();
    return shares.filter(item => {
      const matchesQ = !s || (item.name || '').toLowerCase().includes(s) || (item.caption || '').toLowerCase().includes(s);
      if (!matchesQ) return false;
      if (type === 'all') return true;
      const mime = item.type || '';
      if (type === 'image') return mime.startsWith('image/');
      if (type === 'video') return mime.startsWith('video/');
      return !mime.startsWith('image/') && !mime.startsWith('video/');
    });
  }, [shares, q, type]);

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
        caption: 'compass',
        color: '#0A84FF',
        cardTitle: file.name,
        author: 'rankvault',
        meta: { desk: 'quietcompass' },
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
    listPublicShares(48).then(setShares).catch(() => {});
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-16 px-5 max-w-6xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="text-4xl font-semibold tracking-tight mb-2"
        >
          quiet compass
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.06 }}
          className="text-neutral-400 mb-8 max-w-2xl"
        >
          A calm compass for recent public shares. Filter by type, search, and drop local files to place them on the map. Soft size warnings only. Every link carries a polished Discord embed. Human-crafted spring motion on frosted glass.
        </motion.p>

        <div className="grid md:grid-cols-[1fr_300px] gap-6">
          <div>
            <div className="flex flex-wrap gap-2 mb-4">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="search shares…"
                className="flex-1 min-w-[160px] glass rounded-2xl px-4 py-2.5 text-sm outline-none"
              />
              {(['all', 'image', 'video', 'other'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`px-3 py-1.5 rounded-full text-xs capitalize ${type === t ? 'bg-white text-black' : 'glass text-neutral-300 hover:bg-white/10'}`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <AnimatePresence>
                {filtered.map((item, i) => (
                  <motion.a
                    key={item.id}
                    href={shareUrls(item.id).app}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03, type: 'spring', stiffness: 140, damping: 18 }}
                    whileHover={{ y: -6, scale: 1.02 }}
                    className="glass rounded-[24px] p-4 block hover:bg-white/[0.05] transition"
                  >
                    {item.type?.startsWith('image/') && item.fileUrl && (
                      <img src={item.fileUrl} alt="" className="w-full h-32 object-cover rounded-2xl mb-3" />
                    )}
                    <p className="text-sm font-medium truncate">{item.name || 'untitled'}</p>
                    <p className="text-xs text-neutral-500 mt-1">{(item.size / 1024).toFixed(0)} KB</p>
                    {item.caption && <p className="text-xs text-neutral-400 mt-1 line-clamp-2">{item.caption}</p>}
                  </motion.a>
                ))}
              </AnimatePresence>
            </div>
            {!filtered.length && <p className="text-neutral-500 text-sm mt-8">no shares match the compass yet.</p>}
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
              <input type="file" multiple onChange={(e) => e.target.files && onDrop(e.target.files)} className="hidden" id="compass-file" />
              <label htmlFor="compass-file" className="cursor-pointer block text-sm text-neutral-400">
                drop files to place on the compass
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
              {status === 'uploading' ? 'placing…' : 'publish to compass'}
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
