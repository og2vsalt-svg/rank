import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function LumenlinePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [note, setNote] = useState('');
  const [accent, setAccent] = useState('#A0D8FF');
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
        caption: note || 'lumenline share',
        cardTitle: file.name,
        color: accent,
        meta: { desk: 'lumenline', accent },
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
      {/* soft drifting vertical light lines */}
      <div className="pointer-events-none absolute inset-0">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <motion.div
            key={i}
            className="absolute w-px opacity-25"
            style={{ 
              background: `linear-gradient(180deg, transparent, ${accent}, transparent)`,
              height: '130%',
              left: `${8 + i * 15}%`,
              top: '-15%',
            }}
            initial={{ y: '-10%', opacity: 0.1 }}
            animate={{
              y: ['-10%', '10%', '-5%'],
              opacity: [0.1, 0.35, 0.12],
            }}
            transition={{ 
              duration: 16 + i * 2.5, 
              repeat: Infinity, 
              ease: 'easeInOut',
              delay: i * 0.8,
            }}
          />
        ))}
      </div>

      <div className="pt-28 pb-20 px-5 max-w-xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 110, damping: 20 }}
          className="glass rounded-[28px] p-8"
        >
          <p className="text-neutral-400 text-sm mb-2 tracking-wide">lumenline</p>
          <h1 className="text-2xl font-semibold mb-3 tracking-tight">vertical light for what you carry.</h1>
          <p className="text-neutral-500 text-sm mb-6 leading-relaxed">
            Multi-file drop with a shared note and accent color. Soft vertical lines that drift with the light you choose. Spring motion, glass surfaces, polished Discord embeds. Each file lands in storage and the public_shares table. Large files warned, never refused. All earlier desks stay intact.
          </p>

          <div className="flex items-center gap-3 mb-4">
            <label className="text-xs text-neutral-400">accent</label>
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="w-10 h-10 rounded-full border border-white/10 bg-transparent cursor-pointer"
            />
            <span className="text-xs text-neutral-500 font-mono">{accent}</span>
          </div>

          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="a soft note"
            className="w-full mb-4 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm placeholder:text-neutral-500 focus:outline-none focus:border-white/30 transition-all"
          />

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
            className="w-full mt-5 py-3 rounded-full bg-white/10 text-white text-sm font-medium hover:bg-white/20 disabled:opacity-50 transition"
            style={{ boxShadow: `0 0 40px -8px ${accent}66` }}
          >
            {busy ? 'sharing…' : 'draw the line'}
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
