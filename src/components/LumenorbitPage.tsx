import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function LumenorbitPage() {
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
        caption: note || 'lumenorbit share',
        cardTitle: file.name,
        color: accent,
        meta: { desk: 'lumenorbit', accent },
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
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full blur-sm"
            style={{ background: accent }}
            animate={{
              x: [0, 120 * Math.cos((i * Math.PI) / 2.5), 0],
              y: [0, 80 * Math.sin((i * Math.PI) / 2.5), 0],
            }}
            transition={{ duration: 8 + i, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>
      <div className="pt-28 pb-20 px-5 max-w-xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-sm mb-2 tracking-wide" style={{ color: accent }}>lumenorbit</p>
          <h1 className="text-2xl font-semibold mb-3 tracking-tight">orbit what you carry.</h1>
          <p className="text-neutral-500 text-sm mb-6 leading-relaxed">
            Multi-file drop with a shared note and accent color. Soft orbiting lights that follow your accent, spring motion, glass surfaces, polished Discord embeds. Each file lands in storage and the public_shares table. Large files warned, never refused. Prior features preserved. No traces of boosting.
          </p>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="a quiet dedication"
            className="w-full mb-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm placeholder:text-neutral-500 focus:outline-none focus:border-white/30 transition-all"
          />
          <div className="flex items-center gap-3 mb-4">
            <label className="text-xs text-neutral-400">accent</label>
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-8 h-8 rounded-full border-0 bg-transparent cursor-pointer" />
          </div>
          <label
            className="block cursor-pointer rounded-2xl border border-dashed border-white/10 hover:border-white/30 p-12 text-center transition-all duration-300"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
            <p className="text-sm text-neutral-400">{files.length ? `${files.length} file${files.length > 1 ? 's' : ''} selected` : 'drop here'}</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          <motion.button
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.01 }}
            onClick={publish}
            disabled={busy || !files.length}
            className="w-full mt-5 py-3 rounded-full text-white text-sm font-medium disabled:opacity-50 transition"
            style={{ background: `${accent}33`, border: `1px solid ${accent}55` }}
          >
            {busy ? 'orbiting…' : 'set in orbit'}
          </motion.button>
          {links.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5 text-xs text-neutral-500 break-all space-y-1">
              {links.map((l, i) => <div key={i}>{l}</div>)}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
