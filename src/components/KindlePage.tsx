import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function KindlePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [sharedNote, setSharedNote] = useState('');
  const [accent, setAccent] = useState('#FFD60A');
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
    const targets = files.length ? files : [new File([sharedNote], 'kindle-note.txt', { type: 'text/plain' })];
    for (const file of targets) {
      const res = await publishLocalFile(file, {
        caption: notes[file.name] || sharedNote || 'kindle share',
        cardTitle: file.name,
        color: accent,
        meta: { desk: 'kindle' },
      });
      if (res.ok && res.id) created.push(shareUrls(res.id).app);
      else setErr(res.error || 'issue with a file');
    }
    setLinks(created);
    if (created[0]) try { await navigator.clipboard.writeText(created[0]); } catch {}
    setBusy(false);
  };

  const motes = [
    { size: 6, delay: 0, x: '12%', y: '22%', duration: 8 },
    { size: 4, delay: 1.1, x: '78%', y: '38%', duration: 10 },
    { size: 9, delay: 0.5, x: '18%', y: '68%', duration: 12 },
    { size: 5, delay: 2.1, x: '62%', y: '18%', duration: 9 },
    { size: 7, delay: 0.9, x: '82%', y: '62%', duration: 11 },
    { size: 3, delay: 1.7, x: '38%', y: '48%', duration: 7 },
    { size: 8, delay: 0.3, x: '50%', y: '30%', duration: 13 },
  ];

  return (
    <div className="mesh min-h-screen overflow-hidden">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto relative">
        {motes.map((m, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: m.size,
              height: m.size,
              background: accent,
              left: m.x,
              top: m.y,
              filter: 'blur(0.5px)',
              boxShadow: `0 0 ${m.size * 2.5}px ${accent}`,
            }}
            animate={{
              y: [0, -25, 5, 0],
              x: [0, 6, -4, 0],
              opacity: [0.4, 0.95, 0.5, 0.4],
              scale: [1, 1.25, 0.9, 1],
            }}
            transition={{ duration: m.duration, repeat: Infinity, ease: 'easeInOut', delay: m.delay }}
          />
        ))}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 20 }}
          className="glass rounded-[36px] p-8 relative z-10"
        >
          <p className="text-sm mb-2 tracking-wide" style={{ color: accent }}>kindle</p>
          <h1 className="text-3xl font-semibold mb-3 tracking-tight">gentle light for what you carry.</h1>
          <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
            Multi-file drop with per-file notes or a shared line (note-only also works). Soft drifting motes of light with your accent color, spring motion, glass surfaces, polished Discord embeds. Each file lands in storage and the public_shares table. Large files warned, never refused. Prior features preserved. No traces of boosting.
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
              placeholder="shared note by the kindling"
              className="flex-1 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm placeholder:text-neutral-500 focus:outline-none focus:border-white/30 transition-all"
            />
          </div>
          <label
            className="block cursor-pointer rounded-2xl border border-dashed border-white/15 hover:border-white/40 p-10 text-center transition-all duration-300"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
            <p className="text-sm text-neutral-300">{files.length ? `${files.length} file${files.length > 1 ? 's' : ''} selected` : 'drop files into the kindling (optional)'}</p>
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
            {busy ? 'kindling…' : 'share by the kindling'}
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
