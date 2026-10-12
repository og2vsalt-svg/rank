import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function HaloPage() {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');
  const [err, setErr] = useState('');

  const onFile = (list: FileList | null) => {
    const f = list?.[0] || null;
    setFile(f);
    setWarn(f && f.size > 40 * 1024 * 1024 ? 'large file. browser may slow while sending. no hard limit.' : '');
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
        caption: caption.trim() || 'halo drop',
        cardTitle: file.name,
        meta: { desk: 'halo' },
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
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="glass rounded-[32px] p-8 relative overflow-hidden"
        >
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#0A84FF]/20 rounded-full blur-3xl pointer-events-none" />
          <p className="text-[#0A84FF] text-sm mb-2 tracking-wide">halo</p>
          <h1 className="text-3xl font-semibold mb-3 tracking-tight">a quiet drop with a soft glow.</h1>
          <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
            Drop one local file. It lands in storage and the share table. Every link gets a polished Discord embed. Soft warning for large files only.
          </p>
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="optional caption"
            className="w-full mb-4 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm placeholder:text-neutral-500 focus:outline-none focus:border-[#0A84FF]/50 transition"
          />
          <label
            className="block cursor-pointer rounded-2xl border border-dashed border-white/15 hover:border-[#0A84FF]/40 p-8 text-center transition mb-4"
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
            className="w-full py-3 rounded-full bg-[#0A84FF] text-white text-sm font-medium hover:bg-[#409CFF] disabled:opacity-50 transition"
          >
            {busy ? 'glowing…' : 'publish halo'}
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
