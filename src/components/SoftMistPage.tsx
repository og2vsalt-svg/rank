import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function SoftMistPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [err, setErr] = useState('');

  const onFiles = (list: FileList | null) => {
    const arr = Array.from(list || []);
    setFiles(arr);
    const large = arr.some((f) => f.size > 40 * 1024 * 1024);
    setWarn(large ? 'some files are large. the browser may slow while sending. no hard limit.' : '');
  };

  const publish = async () => {
    if (!files.length) {
      setErr('drop some files first');
      return;
    }
    setBusy(true);
    setErr('');
    setLinks([]);
    const newLinks: string[] = [];
    try {
      for (const file of files) {
        const res = await publishLocalFile(file, {
          caption: caption.trim() || 'soft mist drop',
          cardTitle: file.name,
          meta: { desk: 'softmist' },
        });
        if (res.ok && res.id) {
          const urls = shareUrls(res.id);
          newLinks.push(urls.app);
          if (res.warn) setWarn(res.warn);
        } else {
          setErr(res.error || 'one publish failed');
        }
      }
      setLinks(newLinks);
      if (newLinks.length) {
        try {
          await navigator.clipboard.writeText(newLinks.join('\n'));
        } catch {}
      }
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 80, damping: 18 }}
          className="glass rounded-[32px] p-8 relative overflow-hidden"
        >
          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-[#0A84FF]/10 rounded-full blur-3xl pointer-events-none" />
          <p className="text-[#0A84FF] text-sm mb-2 tracking-wide">softmist</p>
          <h1 className="text-3xl font-semibold mb-3 tracking-tight">files settle into soft mist.</h1>
          <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
            Drop local files. They rise and fade like morning mist around a shared note. Every link carries a polished Discord embed. Soft warnings only for large drops.
          </p>
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="shared mist note"
            className="w-full mb-4 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm placeholder:text-neutral-500 focus:outline-none focus:border-[#0A84FF]/50 transition"
          />
          <label
            className="block cursor-pointer rounded-2xl border border-dashed border-white/15 hover:border-[#0A84FF]/40 p-8 text-center transition mb-4"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              onFiles(e.dataTransfer.files);
            }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-sm text-neutral-300">{files.length ? `${files.length} file${files.length > 1 ? 's' : ''} ready` : 'drop or click for files'}</p>
          </label>
          <AnimatePresence>
            {files.map((f, i) => (
              <motion.div
                key={f.name + i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: i * 0.05 }}
                className="text-xs text-neutral-500 mb-1"
              >
                {f.name}
              </motion.div>
            ))}
          </AnimatePresence>
          {warn && <p className="text-xs text-amber-300/80 mb-3 mt-2">{warn}</p>}
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={publish}
            disabled={busy || !files.length}
            className="w-full py-3 rounded-full bg-[#0A84FF] text-white text-sm font-medium hover:bg-[#409CFF] disabled:opacity-50 transition"
          >
            {busy ? 'settling…' : 'publish mist'}
          </motion.button>
          {links.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 text-xs text-neutral-400 space-y-1">
              <p>copied share links:</p>
              {links.map((l, i) => (
                <div key={i} className="break-all">
                  {l}
                </div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
