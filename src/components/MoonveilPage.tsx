import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function MoonveilPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [sharedNote, setSharedNote] = useState('');
  const [accent, setAccent] = useState('#C4B5FD');
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
    if (!files.length && !sharedNote.trim()) return setErr('select files or add a note');
    setBusy(true);
    setErr('');
    const created: string[] = [];
    const targets = files.length ? files : [new File([sharedNote], 'moonveil-note.txt', { type: 'text/plain' })];
    for (const file of targets) {
      const res = await publishLocalFile(file, {
        caption: notes[file.name] || sharedNote || 'moonveil share',
        cardTitle: file.name,
        color: accent,
        meta: { desk: 'moonveil' },
      });
      if (res.ok && res.id) created.push(shareUrls(res.id).app);
      else setErr(res.error || 'issue with a file');
    }
    setLinks(created);
    if (created[0]) try { await navigator.clipboard.writeText(created[0]); } catch {}
    setBusy(false);
  };

  const veils = [
    { size: 12, delay: 0, x: '8%', y: '18%', duration: 14 },
    { size: 8, delay: 1.5, x: '72%', y: '32%', duration: 16 },
    { size: 15, delay: 0.6, x: '22%', y: '62%', duration: 12 },
    { size: 6, delay: 2.4, x: '55%', y: '10%', duration: 18 },
    { size: 10, delay: 0.9, x: '88%', y: '52%', duration: 15 },
    { size: 7, delay: 1.8, x: '40%', y: '42%', duration: 13 },
    { size: 9, delay: 0.3, x: '15%', y: '78%', duration: 17 },
    { size: 5, delay: 2.1, x: '62%', y: '25%', duration: 11 },
  ];

  return (
    <div className="mesh min-h-screen overflow-hidden">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto relative">
        {veils.map((v, i) => (
          <motion.div
            key={i}
            className="absolute pointer-events-none"
            style={{
              width: v.size * 2,
              height: v.size,
              background: `linear-gradient(90deg, transparent, ${accent}60, transparent)`,
              left: v.x,
              top: v.y,
              borderRadius: '50%',
              filter: 'blur(3px)',
              opacity: 0.35,
            }}
            animate={{
              y: [0, -18, 4, 0],
              x: [0, 12, -8, 0],
              opacity: [0.2, 0.5, 0.25, 0.2],
              scaleX: [1, 1.15, 0.9, 1],
            }}
            transition={{ duration: v.duration, repeat: Infinity, ease: 'easeInOut', delay: v.delay }}
          />
        ))}
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 65, damping: 19 }}
          className="glass rounded-[42px] p-8 relative z-10"
        >
          <p className="text-sm mb-2 tracking-wide" style={{ color: accent }}>moonveil</p>
          <h1 className="text-3xl font-semibold mb-3 tracking-tight">soft veils for what you carry.</h1>
          <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
            Multi-file drop with per-file notes or a shared dedication (note-only works too). Soft drifting moonveils with your accent color, spring motion, glass surfaces, polished Discord embeds. Each file lands in storage and the public_shares table. Large files warned, never refused. Prior features preserved. No traces of boosting.
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
              placeholder="shared moonveil note"
              className="flex-1 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm placeholder:text-neutral-500 focus:outline-none focus:border-white/30 transition-all"
            />
          </div>
          <label
            className="block cursor-pointer rounded-2xl border border-dashed border-white/15 hover:border-white/40 p-10 text-center transition-all duration-300"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
            <p className="text-sm text-neutral-300">{files.length ? `${files.length} file${files.length > 1 ? 's' : ''} selected` : 'drop files into the veil (optional)'}</p>
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
            disabled={busy || (!files.length && !sharedNote.trim())}
            style={{ backgroundColor: accent }}
            className="w-full mt-4 py-3 rounded-full text-white text-sm font-medium disabled:opacity-50 transition"
          >
            {busy ? 'veiling…' : 'share the moonveil'}
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
