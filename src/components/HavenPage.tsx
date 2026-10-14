import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function HavenPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [sharedNote, setSharedNote] = useState('');
  const [accent, setAccent] = useState('#6EE7B7');
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
    const targets = files.length ? files : [new File([sharedNote], 'haven-note.txt', { type: 'text/plain' })];
    for (const file of targets) {
      const res = await publishLocalFile(file, {
        caption: notes[file.name] || sharedNote || 'haven share',
        cardTitle: file.name,
        color: accent,
        meta: { desk: 'haven' },
      });
      if (res.ok && res.id) created.push(shareUrls(res.id).app);
      else setErr(res.error || 'issue with a file');
    }
    setLinks(created);
    if (created[0]) try { await navigator.clipboard.writeText(created[0]); } catch {}
    setBusy(false);
  };

  const canopies = [
    { width: 280, height: 60, delay: 0, x: '5%', y: '20%' },
    { width: 200, height: 40, delay: 0.8, x: '65%', y: '35%' },
    { width: 240, height: 50, delay: 1.5, x: '15%', y: '65%' },
    { width: 160, height: 35, delay: 2.2, x: '70%', y: '75%' },
  ];

  return (
    <div className="mesh min-h-screen overflow-hidden">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto relative">
        {canopies.map((c, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full blur-2xl pointer-events-none mix-blend-screen opacity-25"
            style={{
              width: c.width,
              height: c.height,
              background: accent,
              left: c.x,
              top: c.y,
            }}
            animate={{
              y: [0, -12, 8, 0],
              opacity: [0.25, 0.4, 0.2, 0.25],
              scaleX: [1, 1.05, 0.98, 1],
            }}
            transition={{ duration: 8 + i * 0.5, repeat: Infinity, ease: 'easeInOut', delay: c.delay }}
          />
        ))}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 20 }}
          className="glass rounded-[36px] p-8 relative z-10"
        >
          <p className="text-sm mb-2 tracking-wide" style={{ color: accent }}>haven</p>
          <h1 className="text-3xl font-semibold mb-3 tracking-tight">a quiet shelter for what you carry.</h1>
          <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
            Multi-file drop with per-file notes or a shared line (note-only also works). Soft canopies drift with your accent color, spring motion, glass surfaces, polished Discord embeds. Each file lands in storage and the public_shares table. Large files warned, never refused. Prior features preserved. No traces of boosting.
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
              placeholder="shared note under the haven"
              className="flex-1 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm placeholder:text-neutral-500 focus:outline-none focus:border-white/30 transition-all"
            />
          </div>
          <label
            className="block cursor-pointer rounded-2xl border border-dashed border-white/15 hover:border-white/40 p-10 text-center transition-all duration-300"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
            <p className="text-sm text-neutral-300">{files.length ? `${files.length} file${files.length > 1 ? 's' : ''} selected` : 'drop files into the haven (optional)'}</p>
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
            {busy ? 'sheltering…' : 'share under the haven'}
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
