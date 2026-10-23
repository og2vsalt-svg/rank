import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function SoftlumenflowPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [note, setNote] = useState('');
  const [color, setColor] = useState('#BAE6FD');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [err, setErr] = useState('');

  const onDrop = (list: FileList | null) => {
    if (!list?.length) return;
    const arr = Array.from(list);
    setFiles(arr);
    const big = arr.some((f) => f.size > 40 * 1024 * 1024);
    setWarn(big ? 'large drop. the browser may feel slow while it sends. no hard limit.' : '');
    setErr('');
    setLinks([]);
  };

  const publish = async () => {
    if (!files.length) return;
    setBusy(true);
    setErr('');
    const newLinks: string[] = [];
    try {
      for (const file of files) {
        const res = await publishLocalFile(file, { caption: note || 'quiet lumen flow', color, cardTitle: file.name });
        if (res.ok && res.id) {
          newLinks.push(shareUrls(res.id).app);
          if (res.warn) setWarn(res.warn);
        } else {
          setErr(res.error || 'failed to land one file');
        }
      }
      setLinks(newLinks);
      if (newLinks.length) {
        try { await navigator.clipboard.writeText(newLinks.join('\n')); } catch {}
      }
    } catch (e: any) {
      setErr(e?.message || 'publish failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen relative overflow-hidden">
      <Navbar />
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full blur-xl opacity-40"
            style={{
              background: color,
              width: `${100 + i * 40}px`,
              height: `${60 + i * 20}px`,
              left: `${20 + i * 15}%`,
              top: `${25 + i * 10}%`,
            }}
            animate={{
              x: [0, 40, 0],
              y: [0, -20, 0],
              scale: [1, 1.15, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 7 + i * 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.7,
            }}
          />
        ))}
      </div>
      <div className="relative pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-sm mb-2 tracking-wide" style={{ color }}>softlumenflow</p>
          <h1 className="text-3xl font-semibold mb-3 tracking-tight">quiet flowing lumen for what you carry.</h1>
          <p className="text-neutral-400 text-sm leading-relaxed mb-6">
            Drop files into soft light. Gentle flowing orbs of lumen shift, breathe, and settle in your color. Each lands in storage and the public_shares table with a polished Discord embed. Large files warned, never refused.
          </p>
          <div className="space-y-4 mb-6">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="shared note (optional)"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-white/20"
            />
            <div className="flex items-center gap-3">
              <label className="text-xs text-neutral-500">accent</label>
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-10 rounded-full cursor-pointer border-0" />
              <span className="text-xs text-neutral-400">{color}</span>
            </div>
          </div>
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-white/30 p-10 text-center transition"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onDrop(e.dataTransfer.files); }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => onDrop(e.target.files)} />
            <p className="text-white font-medium">{files.length ? `${files.length} file${files.length > 1 ? 's' : ''} ready` : 'click or drop files'}</p>
            <p className="text-xs text-neutral-500 mt-2">no hard limits — only gentle warnings</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={busy || !files.length}
            onClick={publish}
            className="mt-6 w-full py-3 rounded-full text-sm font-medium disabled:opacity-40"
            style={{ background: color, color: '#000' }}
          >
            {busy ? 'landing…' : 'share quietly'}
          </motion.button>
          {links.length > 0 && (
            <div className="mt-6 space-y-2">
              <p className="text-xs text-neutral-400">links copied:</p>
              {links.map((l) => (
                <p key={l} className="text-xs text-neutral-300 break-all">{l}</p>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
