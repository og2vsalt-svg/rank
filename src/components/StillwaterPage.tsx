import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function StillwaterPage() {
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [accent, setAccent] = useState('#30D158');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');
  const [err, setErr] = useState('');

  const onFile = (list: FileList | null) => {
    const f = list?.[0] || null;
    setFile(f);
    const big = f && f.size > 40 * 1024 * 1024;
    setWarn(
      big
        ? 'large file. the browser may feel slow while sending. no hard limit — only a gentle warning.'
        : '',
    );
  };

  const publish = async () => {
    if (!file) {
      setErr('drop a file');
      return;
    }
    setBusy(true);
    setErr('');
    setLink('');
    try {
      const res = await publishLocalFile(file, {
        caption: note.trim() || 'stillwater drop',
        cardTitle: file.name,
        color: accent,
        meta: { desk: 'stillwater', accent, longNote: note.trim() || null },
      });
      if (!res.ok || !res.id) {
        setErr(res.error || 'publish failed');
        return;
      }
      if (res.warn) setWarn(res.warn);
      const urls = shareUrls(res.id);
      setLink(urls.app);
      try {
        await navigator.clipboard.writeText(urls.app);
      } catch {}
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
          transition={{ type: 'spring', stiffness: 80, damping: 20 }}
          className="glass rounded-[40px] p-10 relative overflow-hidden"
        >
          <div
            className="absolute inset-0 opacity-5 pointer-events-none"
            style={{ background: `radial-gradient(circle at 30% 20%, ${accent}, transparent 60%)` }}
          />
          <p className="text-sm mb-3 tracking-wide" style={{ color: accent }}>
            stillwater
          </p>
          <h1 className="text-3xl font-semibold mb-4 tracking-tight">a quiet surface for one file.</h1>
          <p className="text-neutral-400 text-sm mb-8 leading-relaxed">
            Drop a single local file onto the still water. It lands in storage and the public share table with your longer note and soft accent. The link carries a polished Discord embed. Large files are warned, never refused. Prior desks remain unchanged.
          </p>

          <div className="flex items-center gap-3 mb-6">
            <label className="text-xs text-neutral-400">accent</label>
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="w-12 h-12 rounded-2xl border border-white/10 bg-transparent cursor-pointer"
            />
            <span className="text-xs text-neutral-500 font-mono">{accent}</span>
          </div>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="a longer note that travels with the file — optional"
            rows={6}
            className="w-full mb-6 px-5 py-4 rounded-3xl bg-white/5 border border-white/10 text-sm placeholder:text-neutral-500 focus:outline-none transition resize-none leading-relaxed"
          />

          <label
            className="block cursor-pointer rounded-3xl border border-dashed border-white/15 hover:border-white/30 p-10 text-center transition mb-6"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              onFile(e.dataTransfer.files);
            }}
          >
            <input type="file" className="hidden" onChange={(e) => onFile(e.target.files)} />
            <p className="text-sm text-neutral-300">
              {file ? file.name : 'drop or click for one quiet file'}
            </p>
            {file && (
              <p className="text-xs text-neutral-500 mt-2">
                {(file.size / 1024 / 1024).toFixed(1)} MB
              </p>
            )}
          </label>

          {warn && <p className="text-xs text-amber-300/80 mb-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mb-4">{err}</p>}

          <motion.button
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.01 }}
            onClick={publish}
            disabled={busy || !file}
            className="w-full py-3.5 rounded-full text-white text-sm font-medium disabled:opacity-50 transition"
            style={{ background: accent }}
          >
            {busy ? 'settling…' : 'publish stillwater'}
          </motion.button>

          {link && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 text-xs text-neutral-400"
            >
              <p>copied share link:</p>
              <p className="break-all mt-1">{link}</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
