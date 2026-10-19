import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function QuietEchoPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [note, setNote] = useState('');
  const [accent, setAccent] = useState('#30D158');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [err, setErr] = useState('');

  const handleFiles = (list: FileList | null) => {
    const arr = Array.from(list || []);
    setFiles(arr);
    setWarn(arr.some(f => f.size > 40 * 1024 * 1024) ? 'large file. the browser may pause while it sends. never refused.' : '');
  };

  const publish = async () => {
    if (!files.length) return setErr('choose files');
    setBusy(true);
    setErr('');
    const created: string[] = [];
    for (const file of files) {
      const res = await publishLocalFile(file, {
        caption: note || 'quiet echo share',
        cardTitle: file.name,
        color: accent,
        meta: { desk: 'quietecho' },
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
        {[0, 1, 2, 3].map(i => (
          <motion.div
            key={i}
            className="absolute rounded-full pointer-events-none border"
            style={{
              width: '80px',
              height: '80px',
              borderColor: accent,
              borderWidth: '1px',
              left: '50%',
              top: '40%',
              marginLeft: '-40px',
              marginTop: '-40px',
            }}
            animate={{
              scale: [1, 2.5 + i * 0.4, 1],
              opacity: [0.6, 0, 0.6],
            }}
            transition={{
              duration: 4 + i * 0.8,
              repeat: Infinity,
              ease: 'easeOut',
              delay: i * 1.2,
            }}
          />
        ))}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 16 }}
          className="glass rounded-[32px] p-8 relative z-10"
        >
          <p className="text-sm mb-2 tracking-wide" style={{ color: accent }}>quiet echo</p>
          <h1 className="text-3xl font-semibold mb-3 tracking-tight">soft expanding echoes for what you carry.</h1>
          <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
            Multi-file drop with a shared note. Quiet circular rings that expand and fade from a steady center in your accent color. Spring motion, glass surfaces, polished Discord embeds. Each file lands in storage and the public_shares table. Large files warned, never refused. Prior features preserved. No traces of boosting.
          </p>
          <div className="flex gap-3 mb-4">
            <input type="color" value={accent} onChange={e => setAccent(e.target.value)} className="w-12 h-10 rounded-xl border border-white/10 bg-transparent cursor-pointer" />
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="a quiet line under the echo" className="flex-1 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm placeholder:text-neutral-500 focus:outline-none focus:border-white/30" />
          </div>
          <label className="block cursor-pointer rounded-2xl border border-dashed border-white/15 hover:border-white/40 p-10 text-center transition-all duration-300" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}>
            <input type="file" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
            <p className="text-sm text-neutral-300">{files.length ? `${files.length} file${files.length > 1 ? 's' : ''} ready` : 'drop files into the quiet echo'}</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          <motion.button whileTap={{ scale: 0.975 }} whileHover={{ scale: 1.015 }} onClick={publish} disabled={busy || !files.length} style={{ backgroundColor: accent }} className="w-full mt-4 py-3 rounded-full text-black text-sm font-medium disabled:opacity-50">
            {busy ? 'sharing…' : 'share into the quiet echo'}
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
