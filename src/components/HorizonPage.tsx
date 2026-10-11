import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function HorizonPage() {
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');
  const [err, setErr] = useState('');
  const [name, setName] = useState('');

  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    const file = list[0];
    setName(file.name);
    const big = file.size > 40 * 1024 * 1024;
    setWarn(big ? 'large file. the browser may feel slow while encoding and uploading. no hard limit.' : '');
    setErr('');
    setLink('');
    setBusy(true);
    try {
      const res = await publishLocalFile(file, { caption: 'horizon drop', cardTitle: file.name });
      if (!res.ok || !res.id) {
        setErr(res.error || 'could not publish');
        return;
      }
      if (res.warn) setWarn(res.warn);
      const urls = shareUrls(res.id);
      setLink(urls.app);
      try { await navigator.clipboard.writeText(urls.app); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'drop failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
          className="glass rounded-[32px] p-8 apple-card"
        >
          <p className="text-[#0A84FF] text-sm mb-2 tracking-wide">horizon</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">drop, share, unfurl.</h1>
          <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
            Upload a local file straight into the database. Get a professional Discord embed on the share link. Large files get a gentle slowness note — never refused.
          </p>
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0A84FF]/60 p-12 text-center transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}
          >
            <input type="file" className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white font-medium text-lg">{busy ? 'publishing…' : 'click or drop a file'}</p>
            <p className="text-xs text-neutral-500 mt-2">no size cap. only a warning if it might lag.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {link && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 space-y-3">
              <p className="text-xs text-neutral-400 break-all">share link (copied): {link}</p>
              <p className="text-xs text-neutral-500">Discord will unfurl a clean card. Paste anywhere.</p>
              <a href={link} className="inline-flex px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-200 transition">open share</a>
            </motion.div>
          )}
          {name && !link && !busy && <p className="text-xs text-neutral-500 mt-4">ready: {name}</p>}
        </motion.div>
      </div>
    </div>
  );
}
