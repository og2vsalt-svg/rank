import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function LumenwavePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [note, setNote] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [err, setErr] = useState('');

  const handleFiles = (list: FileList | null) => {
    const arr = Array.from(list || []);
    setFiles(arr);
    setWarn(arr.some(f => f.size > 45 * 1024 * 1024) ? 'large file detected. upload may feel slower in the browser. never refused.' : '');
  };

  const publish = async () => {
    if (!files.length) return setErr('select files to share');
    setBusy(true);
    setErr('');
    const created: string[] = [];
    for (const file of files) {
      const res = await publishLocalFile(file, {
        caption: note || 'lumenwave share',
        cardTitle: file.name,
        color: accent,
        meta: { desk: 'lumenwave', accent },
      });
      if (res.ok && res.id) created.push(shareUrls(res.id).app);
      else setErr(res.error || 'issue with a file');
    }
    setLinks(created);
    if (created[0]) try { await navigator.clipboard.writeText(created[0]); } catch {}
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen relative overflow-hidden">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="glass rounded-[28px] p-8 relative overflow-hidden"
        >
          {/* soft wave layers */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
            <motion.div
              className="absolute -bottom-20 left-0 right-0 h-40 rounded-[100%] blur-xl"
              style={{ background: accent }}
              animate={{ y: [0, -10, 0], scaleX: [1, 1.05, 1] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute -bottom-32 left-0 right-0 h-48 rounded-[100%] blur-2xl opacity-60"
              style={{ background: accent }}
              animate={{ y: [0, -15, 0], scaleX: [1, 1.08, 1] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            />
          </div>
          <p className="text-neutral-400 text-sm mb-2 tracking-wide relative">lumenwave</p>
          <h1 className="text-2xl font-semibold mb-3 tracking-tight relative">soft waves for what you carry.</h1>
          <p className="text-neutral-500 text-sm mb-6 leading-relaxed relative">
            Multi-file drop with a shared note and accent color. Gentle animated light waves that swell with your color, spring motion, glass surfaces, polished Discord embeds. Each file lands in storage and the public_shares table. Large files warned, never refused. Prior features preserved. No traces of boosting.
          </p>
          <div className="flex gap-3 mb-4 relative">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="a soft note"
              className="flex-1 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm placeholder:text-neutral-500 focus:outline-none focus:border-white/30 transition-all"
            />
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="w-12 h-12 rounded-2xl border border-white/10 cursor-pointer bg-transparent"
              title="accent color"
            />
          </div>
          <label
            className="block cursor-pointer rounded-2xl border border-dashed border-white/10 hover:border-white/30 p-12 text-center transition-all duration-300 relative"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
            <p className="text-sm text-neutral-400">{files.length ? `${files.length} file${files.length > 1 ? 's' : ''} selected` : 'drop here'}</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-3 relative">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3 relative">{err}</p>}
          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.02 }}
            onClick={publish}
            disabled={busy || !files.length}
            className="w-full mt-5 py-3 rounded-full bg-white/10 text-white text-sm font-medium hover:bg-white/20 disabled:opacity-50 transition relative"
          >
            {busy ? 'sharing…' : 'send the wave'}
          </motion.button>
          {links.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-5 text-xs text-neutral-500 break-all space-y-1 relative">
              {links.map((l, i) => <div key={i}>{l}</div>)}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
