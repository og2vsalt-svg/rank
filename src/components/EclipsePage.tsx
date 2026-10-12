import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function EclipsePage() {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [phase, setPhase] = useState('new');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');
  const [err, setErr] = useState('');

  const onFile = (list: FileList | null) => {
    const f = list?.[0] || null;
    setFile(f);
    setWarn(f && f.size > 40 * 1024 * 1024 ? 'large file. the browser may slow while sending. no hard limit.' : '');
  };

  const publish = async () => {
    if (!file) {
      setErr('drop a file first');
      return;
    }
    setBusy(true);
    setErr('');
    setLink('');
    try {
      const res = await publishLocalFile(file, {
        caption: caption.trim() || `eclipse ${phase}`,
        cardTitle: file.name,
        meta: { desk: 'eclipse', phase },
      });
      if (!res.ok || !res.id) {
        setErr(res.error || 'publish failed');
        return;
      }
      if (res.warn) setWarn(res.warn);
      const urls = shareUrls(res.id);
      setLink(urls.app);
      try { await navigator.clipboard.writeText(urls.app); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 80, damping: 18 }}
          className="glass rounded-[32px] p-8 relative overflow-hidden"
        >
          <motion.div
            className="absolute -top-32 -left-32 w-80 h-80 bg-black rounded-full blur-2xl pointer-events-none opacity-60"
            animate={{ x: [0, 40, 0], y: [0, 20, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          />
          <p className="text-neutral-400 text-sm mb-2 tracking-wide">eclipse</p>
          <h1 className="text-3xl font-semibold mb-3 tracking-tight">a quiet covering for one file.</h1>
          <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
            Drop a local file under a slow eclipse. It lands in storage and the share table. Every link gets a polished Discord embed. Soft warning for large files only.
          </p>
          <div className="flex gap-2 mb-4">
            {['new', 'partial', 'total'].map((p) => (
              <button
                key={p}
                onClick={() => setPhase(p)}
                className={`px-4 py-2 rounded-full text-xs transition ${
                  phase === p ? 'bg-white text-black' : 'bg-white/5 text-neutral-300 hover:bg-white/10'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="optional caption"
            className="w-full mb-4 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm placeholder:text-neutral-500 focus:outline-none focus:border-white/30 transition"
          />
          <label
            className="block cursor-pointer rounded-2xl border border-dashed border-white/15 hover:border-white/40 p-8 text-center transition mb-4"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files); }}
          >
            <input type="file" className="hidden" onChange={(e) => onFile(e.target.files)} />
            <p className="text-sm text-neutral-300">{file ? file.name : 'drop or click for a file'}</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={publish}
            disabled={busy || !file}
            className="w-full py-3 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-200 disabled:opacity-50 transition"
          >
            {busy ? 'covering…' : 'publish eclipse'}
          </motion.button>
          {link && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 text-xs text-neutral-400 break-all">
              copied share link: {link}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
