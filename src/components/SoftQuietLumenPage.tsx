import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(1) + ' mb';
}

export default function SoftQuietLumenPage() {
  const { navigate } = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#FFD60A');
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<{ id: string; name: string; embed: string; warn?: string | null }[]>([]);
  const [err, setErr] = useState('');

  const onFiles = (list: FileList | null) => {
    if (!list) return;
    setFiles((p) => [...p, ...Array.from(list)]);
    setErr('');
  };

  const upload = async () => {
    if (!files.length) return;
    setBusy(true);
    setErr('');
    const out = [];
    for (const file of files) {
      const warn = file.size > 40 * 1024 * 1024 ? 'large drop. the browser may feel slow while the light settles. no hard cap.' : null;
      const res = await publishLocalFile(file, {
        caption: caption || undefined,
        color,
        cardTitle: caption || file.name,
        meta: { source: 'softquietlumen' },
      });
      if (!res.ok || !res.id) {
        setErr(res.error || `failed for ${file.name}`);
        continue;
      }
      out.push({ id: res.id, name: file.name, embed: res.embed || shareUrls(res.id).embed, warn: res.warn || warn });
    }
    setResults(out);
    setFiles([]);
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen relative overflow-hidden">
      <Navbar />
      <motion.div
        className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-[100px]"
        style={{ background: color + '33' }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="relative pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 85, damping: 17 }}
        >
          <p className="text-[#FFD60A] text-sm font-medium mb-2 tracking-wide">soft quiet lumen</p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-3 leading-tight">let files glow into place.</h1>
          <p className="text-neutral-400 text-sm mb-8 leading-relaxed">
            Drop local files into a soft lumen of light. Shared caption and warm accent. Soft pulsing glow and spring motion on frosted glass. Each file lands in storage and public_shares. Every link unfurls a polished Discord embed. Large drops gently warned about possible slowness, never refused. All prior desks remain fully intact. No traces of boosting.
          </p>

          <div
            className="glass rounded-[28px] p-6 mb-5"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}
          >
            <input type="file" multiple className="hidden" id="lumen-input" onChange={(e) => onFiles(e.target.files)} />
            <label htmlFor="lumen-input" className="block text-center cursor-pointer py-8">
              <p className="text-sm text-neutral-300">drop files into the light, or click</p>
              <p className="text-xs text-neutral-500 mt-1">soft warning only if large</p>
            </label>
            {files.length > 0 && (
              <div className="mt-4 space-y-1 text-xs text-neutral-400">
                {files.map((f) => (
                  <div key={f.name + f.size} className="flex justify-between">
                    <span className="truncate">{f.name}</span>
                    <span>{pretty(f.size)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="shared lumen caption (optional)"
            className="w-full glass rounded-full px-4 py-3 text-sm outline-none mb-4"
          />

          <div className="flex items-center gap-3 mb-5">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-12 h-11 rounded-full border border-white/10 bg-transparent cursor-pointer"
            />
            <span className="text-xs text-neutral-400">glow accent</span>
          </div>

          <motion.button
            whileTap={{ scale: 0.96 }}
            disabled={busy || !files.length}
            onClick={upload}
            className="w-full py-3 rounded-full text-black text-sm font-medium disabled:opacity-40"
            style={{ background: color }}
          >
            {busy ? 'settling light…' : 'share the lumen'}
          </motion.button>

          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}

          <AnimatePresence>
            {results.map((r) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-2xl p-4 mt-4"
              >
                <p className="text-sm font-medium truncate">{r.name}</p>
                {r.warn && <p className="text-xs text-amber-300/80 mt-1">{r.warn}</p>}
                <div className="flex gap-2 mt-3">
                  <button onClick={() => navigate('share', r.id)} className="px-3.5 py-1.5 rounded-full bg-white text-black text-xs font-medium">open</button>
                  <button onClick={() => navigator.clipboard.writeText(r.embed).catch(() => {})} className="px-3.5 py-1.5 rounded-full bg-white/10 text-xs">copy embed link</button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
