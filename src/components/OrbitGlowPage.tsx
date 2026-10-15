import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

export default function OrbitGlowPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [note, setNote] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [links, setLinks] = useState<string[]>([]);
  const [warn, setWarn] = useState<string | null>(null);
  const [err, setErr] = useState('');

  const addFiles = (list: File[]) => {
    if (list.some(f => f.size > 40 * 1024 * 1024)) {
      setWarn('large files may feel slow while sending. no hard limit.');
    } else {
      setWarn(null);
    }
    setFiles(prev => [...prev, ...list]);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    addFiles(Array.from(e.dataTransfer.files));
  }, []);

  const shareAll = async () => {
    if (!files.length) return;
    setBusy(true);
    setErr('');
    setLinks([]);
    const created: string[] = [];
    try {
      for (const file of files) {
        const res = await publishLocalFile(file, {
          caption: note || 'orbiting glow',
          color: accent,
          cardTitle: file.name,
          meta: { desk: 'orbitglow' },
        });
        if (res.ok && res.embed) created.push(res.embed);
        else if (!res.ok) setErr(res.error || 'one file failed');
      }
      setLinks(created);
      if (created.length) setFiles([]);
    } catch (e: any) {
      setErr(e?.message || 'share failed');
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
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8 relative overflow-hidden"
        >
          {/* orbiting glows */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full blur-2xl"
                style={{
                  background: accent,
                  width: 80 + i * 30,
                  height: 80 + i * 30,
                  left: '50%',
                  top: '50%',
                  marginLeft: -(40 + i * 15),
                  marginTop: -(40 + i * 15),
                }}
                animate={{
                  rotate: 360,
                  opacity: [0.1, 0.2, 0.1],
                }}
                transition={{
                  rotate: { duration: 20 + i * 5, repeat: Infinity, ease: 'linear' },
                  opacity: { duration: 4 + i, repeat: Infinity, ease: 'easeInOut' },
                }}
              />
            ))}
          </div>

          <p className="text-sm mb-2 relative" style={{ color: accent }}>orbitglow</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3 relative">let it orbit in light.</h1>
          <p className="text-neutral-400 text-sm mb-6 relative">drop files under soft orbiting glows. each lands in the database with a polished Discord link.</p>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            className="relative border-2 border-dashed border-white/10 rounded-2xl p-8 text-center mb-6 hover:border-white/20 transition"
          >
            <input type="file" multiple onChange={(e) => addFiles(Array.from(e.target.files || []))} className="hidden" id="orbit-in" />
            <label htmlFor="orbit-in" className="cursor-pointer text-neutral-300 text-sm">drop files or click</label>
            {files.length > 0 && (
              <ul className="mt-4 space-y-1 text-xs text-neutral-500">
                {files.map((f, i) => <li key={i} className="truncate">{f.name}</li>)}
              </ul>
            )}
          </div>

          {warn && <p className="text-xs text-amber-300/80 mb-4 relative">{warn}</p>}

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="a note for the orbit…"
            rows={3}
            className="relative w-full bg-white/[0.03] border border-white/5 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 mb-4 resize-none focus:outline-none focus:border-white/15"
          />

          <div className="flex items-center gap-3 mb-6 relative">
            <span className="text-xs text-neutral-500">accent</span>
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-8 h-8 rounded-full border-0 cursor-pointer" />
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={shareAll}
            disabled={busy || !files.length}
            className="relative w-full rounded-2xl py-3 text-sm font-medium text-white disabled:opacity-40"
            style={{ background: accent }}
          >
            {busy ? 'orbiting…' : 'share the orbit'}
          </motion.button>

          <AnimatePresence>
            {links.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-2 relative">
                <p className="text-xs text-neutral-400">links ready for Discord</p>
                {links.map((l, i) => (
                  <a key={i} href={l} className="block text-sm break-all" style={{ color: accent }}>{l}</a>
                ))}
              </motion.div>
            )}
            {err && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-xs text-red-400 relative">{err}</motion.p>}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
