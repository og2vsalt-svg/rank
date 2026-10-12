import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function SolarisPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#FF9F0A');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [err, setErr] = useState('');

  const onFiles = (list: FileList | null) => {
    const arr = Array.from(list || []);
    setFiles(arr);
    const big = arr.some(f => f.size > 40 * 1024 * 1024);
    setWarn(big ? 'large file(s). browser may slow while sending. no hard limit.' : '');
  };

  const publish = async () => {
    if (!files.length) {
      setErr('drop at least one file');
      return;
    }
    setBusy(true);
    setErr('');
    setLinks([]);
    const newLinks: string[] = [];
    try {
      for (const file of files) {
        const res = await publishLocalFile(file, {
          caption: caption.trim() || 'solaris drop',
          cardTitle: file.name,
          color: accent,
          meta: { desk: 'solaris', accent },
        });
        if (res.ok && res.id) {
          const urls = shareUrls(res.id);
          newLinks.push(urls.app);
          if (res.warn) setWarn(res.warn);
        } else {
          setErr(res.error || 'one file failed');
        }
      }
      setLinks(newLinks);
      if (newLinks[0]) {
        try { await navigator.clipboard.writeText(newLinks.join('\n')); } catch {}
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
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 80, damping: 18 }}
          className="glass rounded-[36px] p-8 relative overflow-hidden"
        >
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full blur-3xl pointer-events-none" style={{ background: `${accent}33` }} />
          <p className="text-sm mb-2 tracking-wide" style={{ color: accent }}>solaris</p>
          <h1 className="text-3xl font-semibold mb-3 tracking-tight">sunlit multi-file drop.</h1>
          <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
            Drop several local files at once. Each lands in storage and the share table. Shared note and accent color travel with them. Polished Discord embeds on every link. Large files get a gentle warning only.
          </p>
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="shared note (optional)"
            className="w-full mb-4 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm placeholder:text-neutral-500 focus:outline-none focus:border-orange-400/50 transition"
          />
          <div className="flex items-center gap-3 mb-4">
            <label className="text-xs text-neutral-400">accent</label>
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full border-0 bg-transparent cursor-pointer" />
          </div>
          <label
            className="block cursor-pointer rounded-2xl border border-dashed border-white/15 hover:border-orange-400/40 p-10 text-center transition mb-4"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-sm text-neutral-300">{files.length ? `${files.length} file${files.length > 1 ? 's' : ''} ready` : 'drop or click for files'}</p>
            {files.length > 0 && <p className="text-xs text-neutral-500 mt-1">{files.map(f => f.name).join(', ')}</p>}
          </label>
          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={publish}
            disabled={busy || !files.length}
            className="w-full py-3 rounded-full text-white text-sm font-medium disabled:opacity-50 transition"
            style={{ background: accent }}
          >
            {busy ? 'warming…' : 'publish solaris'}
          </motion.button>
          {links.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 space-y-1 text-xs text-neutral-400 break-all">
              <p>copied share links:</p>
              {links.map((l, i) => <div key={i}>{l}</div>)}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
