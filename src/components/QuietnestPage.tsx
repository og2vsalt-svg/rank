import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function QuietnestPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [note, setNote] = useState('');
  const [accent, setAccent] = useState('#AF52DE');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [err, setErr] = useState('');

  const handleFiles = (list: FileList | null) => {
    const arr = Array.from(list || []);
    setFiles(arr);
    setWarn(arr.some(f => f.size > 40 * 1024 * 1024) ? 'large file. the browser may pause. never refused.' : '');
  };

  const publish = async () => {
    if (!files.length) return setErr('choose files');
    setBusy(true);
    setErr('');
    const created: string[] = [];
    for (const file of files) {
      const res = await publishLocalFile(file, {
        caption: note || 'quietnest share',
        cardTitle: file.name,
        color: accent,
        meta: { desk: 'quietnest' },
      });
      if (res.ok && res.id) created.push(shareUrls(res.id).app);
      else setErr(res.error || 'one file paused');
    }
    setLinks(created);
    if (created[0]) try { await navigator.clipboard.writeText(created[0]); } catch {}
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen overflow-hidden">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto relative">
        {[0,1,2].map(i => (
          <motion.div
            key={i}
            className="absolute left-1/2 top-1/2 pointer-events-none rounded-full"
            style={{ 
              width: `${40 + i * 25}%`,
              height: `${40 + i * 25}%`,
              marginLeft: `-${20 + i * 12.5}%`,
              marginTop: `-${20 + i * 12.5}%`,
              border: `1px solid ${accent}33`,
              boxShadow: `0 0 40px ${accent}22`,
              opacity: 0.6 - i * 0.15,
            }}
            animate={{ 
              scale: [1, 1.08, 1],
              opacity: [0.4 - i * 0.1, 0.7 - i * 0.1, 0.4 - i * 0.1]
            }}
            transition={{ 
              duration: 6 + i * 1.5, 
              repeat: Infinity, 
              ease: 'easeInOut'
            }}
          />
        ))}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 80, damping: 18 }}
          className="relative z-10 glass rounded-3xl p-8"
        >
          <p className="text-xs tracking-widest uppercase mb-2 font-medium" style={{ color: accent }}>quietnest</p>
          <h1 className="text-3xl font-semibold mb-3 tracking-tight">quiet nested rings of light for what you carry.</h1>
          <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
            Multi-file drop with a shared note. Soft concentric rings that gently pulse and breathe in your accent color, like a quiet nest holding what you set down. Spring motion, glass surfaces, polished Discord embeds. Each file lands in storage and the public_shares table. Large files warned, never refused. All prior desks remain.
          </p>
          <div className="flex gap-3 mb-4">
            <input type="color" value={accent} onChange={e => setAccent(e.target.value)} className="w-12 h-10 rounded-xl border border-white/10 bg-transparent cursor-pointer" />
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="a quiet line inside the nest" className="flex-1 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm placeholder:text-neutral-500 focus:outline-none focus:border-white/30" />
          </div>
          <label className="block cursor-pointer rounded-2xl border border-dashed border-white/15 hover:border-white/40 p-10 text-center transition-all duration-300" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}>
            <input type="file" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
            <p className="text-sm text-neutral-300">{files.length ? `${files.length} file${files.length>1?'s':''} ready` : 'drop files into the quietnest'}</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          <motion.button whileTap={{ scale: 0.975 }} whileHover={{ scale: 1.015 }} onClick={publish} disabled={busy || !files.length} style={{ backgroundColor: accent }} className="w-full mt-4 py-3 rounded-full text-black text-sm font-medium disabled:opacity-50">
            {busy ? 'sharing…' : 'share into the quietnest'}
          </motion.button>
          {links.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5 text-xs text-neutral-400 break-all space-y-1">
              {links.map((l, i) => <div key={i}>shared: {l}</div>)}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
