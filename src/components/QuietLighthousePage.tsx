import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, publishLocalFile, shareUrls, type CloudMeta } from '../lib/cloudShare';

export default function QuietLighthousePage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#FF9500');
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  useEffect(() => {
    listPublicShares(12).then(setShares).catch(() => {});
  }, []);

  const onDrop = useCallback((list: FileList | null) => {
    if (list) setFiles(Array.from(list));
  }, []);

  const publish = async () => {
    if (!files.length) return;
    setBusy(true);
    const made: string[] = [];
    for (const file of files) {
      const res = await publishLocalFile(file, {
        caption: caption.trim() || 'from the quiet lighthouse',
        color: accent,
        cardTitle: file.name,
        meta: { desk: 'quietlighthouse' },
      });
      if (res.ok && res.embed) made.push(res.embed);
    }
    setResults(made);
    setFiles([]);
    listPublicShares(12).then(setShares).catch(() => {});
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 22 }}
          className="text-center mb-10 relative"
        >
          <motion.div
            className="absolute left-1/2 -top-8 w-1 h-16 origin-bottom"
            style={{ background: accent, boxShadow: `0 0 20px ${accent}` }}
            animate={{ rotate: [ -20, 20, -20 ] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <p className="text-[13px] font-medium tracking-wide mb-2" style={{ color: accent }}>Quiet Lighthouse</p>
          <h1 className="text-[34px] font-semibold tracking-tight text-white mb-3">Beacon for shares.</h1>
          <p className="text-neutral-400 text-[15px] max-w-lg mx-auto leading-relaxed">
            Drop local files or watch recent public shares light up. Soft rotating lighthouse beam on frosted glass. Shared caption, accent color. Publishes to the database with polished Discord embeds on every link. Soft size warnings only. No hard limits. Apple-style springs. All prior desks remain fully intact.
          </p>
        </motion.div>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); onDrop(e.dataTransfer.files); }}
          className="glass rounded-[32px] p-10 text-center border-dashed border-2 border-white/10 hover:border-white/20 transition-all mb-8"
        >
          <p className="text-neutral-300 mb-4">Drag files here or click to choose</p>
          <label className="inline-block px-6 py-3 rounded-full text-sm font-medium text-white cursor-pointer" style={{ background: accent }}>
            Choose local files
            <input type="file" multiple className="hidden" onChange={(e) => onDrop(e.target.files)} />
          </label>
          {files.length > 0 && <p className="mt-4 text-sm text-neutral-400">{files.length} file{files.length > 1 ? 's' : ''} ready</p>}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Shared caption (optional)"
            className="flex-1 bg-black/20 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/20"
          />
          <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-12 h-12 rounded-full cursor-pointer border-0 self-center" />
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={publish}
          disabled={busy || !files.length}
          className="w-full max-w-md mx-auto block rounded-[20px] py-4 text-[15px] font-medium text-white disabled:opacity-40 shadow-xl mb-12"
          style={{ background: accent }}
        >
          {busy ? 'Lighting the beacon…' : `Publish ${files.length || ''} to the vault`}
        </motion.button>

        <AnimatePresence>
          {results.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-10 space-y-2 max-w-md mx-auto">
              {results.map((l) => (
                <a key={l} href={l} className="block text-sm break-all" style={{ color: accent }}>{l}</a>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <h2 className="text-xl font-semibold mb-6 text-center">Recent beacons</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {shares.map((s, i) => (
            <motion.a
              key={s.id}
              href={shareUrls(s.id).embed}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, type: 'spring', stiffness: 120, damping: 18 }}
              className="glass rounded-2xl p-5 block hover:bg-white/5 transition"
            >
              <p className="text-sm font-medium truncate">{s.name}</p>
              <p className="text-xs text-neutral-400 mt-1 line-clamp-2">{s.caption || 'shared file'}</p>
              <p className="text-[11px] text-neutral-500 mt-2">{(s.size / 1024 / 1024).toFixed(1)} MB · {s.downloads || 0} opens</p>
            </motion.a>
          ))}
        </div>
        {shares.length === 0 && <p className="text-center text-neutral-500 mt-8">No recent shares yet.</p>}
      </div>
    </div>
  );
}
