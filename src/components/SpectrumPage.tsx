import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function SpectrumPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [sharedNote, setSharedNote] = useState('');
  const [accent, setAccent] = useState('#FF6B6B');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [err, setErr] = useState('');

  const handleFiles = (list: FileList | null) => {
    const arr = Array.from(list || []);
    setFiles(arr);
    setWarn(arr.some(f => f.size > 45 * 1024 * 1024) ? 'large file detected. upload may feel slower. never refused.' : '');
  };

  const publish = async () => {
    if (!files.length) return setErr('select files to share');
    setBusy(true);
    setErr('');
    const created: string[] = [];
    for (const file of files) {
      const res = await publishLocalFile(file, {
        caption: notes[file.name] || sharedNote || 'spectrum share',
        cardTitle: file.name,
        color: accent,
        meta: { desk: 'spectrum' },
      });
      if (res.ok && res.id) created.push(shareUrls(res.id).app);
      else setErr(res.error || 'issue with a file');
    }
    setLinks(created);
    if (created[0]) try { await navigator.clipboard.writeText(created[0]); } catch {}
    setBusy(false);
  };

  const spectrumColors = ['#FF6B6B', '#FFA36B', '#FFD93D', '#6BCB77', '#4D96FF', '#9B59B6'];

  return (
    <div className="mesh min-h-screen overflow-hidden">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto relative">
        {spectrumColors.map((color, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full blur-2xl pointer-events-none mix-blend-screen opacity-40"
            style={{
              width: 160 + i * 20,
              height: 140 + i * 15,
              background: color,
              left: `${10 + i * 12}%`,
              top: `${20 + (i % 3) * 15}%`,
            }}
            animate={{
              y: [0, -30, 20, 0],
              x: [0, 15, -10, 0],
              scale: [1, 1.1, 0.95, 1],
            }}
            transition={{ duration: 6 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
          />
        ))}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 18 }}
          className="glass rounded-[32px] p-8 relative z-10"
        >
          <p className="text-sm mb-2 tracking-wide" style={{ color: accent }}>spectrum</p>
          <h1 className="text-3xl font-semibold mb-3 tracking-tight">break light across your files.</h1>
          <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
            Multi-file drop with per-file notes or shared dedication. Spectral glows drift with spring motion, glass surfaces, polished Discord embeds. Each file lands in storage and the public_shares table. Large files warned, never refused. Prior features preserved. No traces of boosting.
          </p>
          <div className="flex gap-3 mb-4 items-center">
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="w-12 h-10 rounded-xl border border-white/10 bg-transparent cursor-pointer"
            />
            <input
              value={sharedNote}
              onChange={(e) => setSharedNote(e.target.value)}
              placeholder="shared note across the spectrum"
              className="flex-1 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm placeholder:text-neutral-500 focus:outline-none focus:border-white/30 transition-all"
            />
          </div>
          <label
            className="block cursor-pointer rounded-2xl border border-dashed border-white/15 hover:border-white/40 p-10 text-center transition-all duration-300"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
            <p className="text-sm text-neutral-300">{files.length ? `${files.length} file${files.length > 1 ? 's' : ''} selected` : 'drop files into the spectrum'}</p>
          </label>
          {files.map(f => (
            <input
              key={f.name}
              value={notes[f.name] || ''}
              onChange={e => setNotes(prev => ({ ...prev, [f.name]: e.target.value }))}
              placeholder={`note for ${f.name}`}
              className="w-full mt-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs"
            />
          ))}
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.02 }}
            onClick={publish}
            disabled={busy || !files.length}
            style={{ backgroundColor: accent }}
            className="w-full mt-4 py-3 rounded-full text-white text-sm font-medium disabled:opacity-50 transition"
          >
            {busy ? 'refracting…' : 'share across the spectrum'}
          </motion.button>
          {links.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-5 text-xs text-neutral-400 break-all space-y-1">
              {links.map((l, i) => <div key={i}>shared: {l}</div>)}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
