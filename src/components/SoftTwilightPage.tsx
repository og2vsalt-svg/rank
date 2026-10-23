import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function SoftTwilightPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [note, setNote] = useState('');
  const [accent, setAccent] = useState('#7D7AFF');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [shares, setShares] = useState<{ name: string; url: string }[]>([]);

  const handleFiles = (list: FileList | File[]) => {
    const arr = Array.from(list);
    setFiles((prev) => [...prev, ...arr]);
    if (arr.some((f) => f.size > 40 * 1024 * 1024)) {
      setWarn('large files detected. the browser may feel slow while sending. no hard limit — only a gentle warning.');
    }
  };

  const publishAll = async () => {
    if (!files.length) {
      setErr('please drop at least one file');
      return;
    }
    setBusy(true);
    setErr('');
    setShares([]);
    const results: { name: string; url: string }[] = [];
    for (const file of files) {
      const res = await publishLocalFile(file, {
        caption: note.trim() || 'soft twilight',
        color: accent,
        cardTitle: file.name,
        meta: { desk: 'softtwilight' },
      });
      if (res.ok && res.id) {
        results.push({ name: file.name, url: shareUrls(res.id).embed });
        if (res.warn) setWarn(res.warn);
      } else {
        setErr(res.error || `failed to share ${file.name}`);
      }
    }
    setShares(results);
    if (results.length) {
      try {
        await navigator.clipboard.writeText(results.map((r) => r.url).join('\n'));
      } catch {}
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 20 }}
          className="glass rounded-[32px] p-8 relative overflow-hidden"
        >
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at 50% 100%, ${accent}22, transparent 70%)`,
            }}
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          />
          <p className="text-sm mb-2" style={{ color: accent }}>
            soft twilight
          </p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">quiet glow between day and night.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            Drop files into the soft twilight. Gentle radial light breathes and settles in your color, like the quiet hour when the sky softens. Each file lands in storage and public_shares with a polished Discord embed. Large files warned, never refused. Spring animations, glass surfaces. Prior features preserved.
          </p>

          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs text-neutral-500">accent</span>
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="w-9 h-9 rounded-full cursor-pointer border border-white/10"
            />
          </div>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="shared note (optional)"
            rows={2}
            className="w-full mb-4 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-white/20 transition"
          />

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFiles(e.dataTransfer.files);
            }}
            className="rounded-2xl border border-dashed border-white/20 hover:border-white/40 p-10 text-center mb-4 cursor-pointer transition"
            onClick={() => document.getElementById('twilight-file')?.click()}
          >
            <input
              id="twilight-file"
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files || [])}
            />
            <p className="text-sm text-neutral-300">
              {files.length ? `${files.length} file${files.length > 1 ? 's' : ''} ready` : 'drop files here or click'}
            </p>
          </div>

          <AnimatePresence>
            {files.length > 0 && (
              <motion.ul
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mb-4 text-xs text-neutral-400 space-y-1"
              >
                {files.map((f, i) => (
                  <li key={i}>{f.name} · {(f.size / 1024 / 1024).toFixed(1)} MB</li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>

          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={publishAll}
            disabled={busy || !files.length}
            className="w-full py-3 rounded-full text-white text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: accent }}
          >
            {busy ? 'settling into twilight…' : 'share into the twilight'}
          </motion.button>

          {shares.length > 0 && (
            <div className="mt-6 space-y-2">
              <p className="text-xs text-neutral-500">links copied to clipboard</p>
              {shares.map((s) => (
                <div key={s.url} className="text-xs text-neutral-300 break-all bg-white/5 rounded-xl p-3">
                  {s.name}: {s.url}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
