import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVault } from './VaultContext';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function SilkBundlePage() {
  const { addFiles } = useVault();
  const { navigate } = useRouter();
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [title, setTitle] = useState('Silk bundle');
  const [caption, setCaption] = useState('A quiet gathering of files');
  const [accent, setAccent] = useState('#AF52DE');
  const [results, setResults] = useState<{ name: string; id: string; warn?: string; url: string; thumb?: string; size: number }[]>([]);
  const [masterId, setMasterId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (!list.length) return;
    setUploading(true);
    setError(null);
    setResults([]);
    setMasterId(null);
    setProgress(0);

    await addFiles(list, 'silkbundle');

    const newResults: typeof results = [];
    for (let i = 0; i < list.length; i++) {
      const file = list[i];
      setProgress(Math.round(((i + 0.4) / list.length) * 100));
      let thumb: string | undefined;
      if (file.type.startsWith('image/')) {
        try { thumb = URL.createObjectURL(file); } catch {}
      }
      try {
        const pub = await publishLocalFile(file, {
          caption: caption || title,
          cardTitle: `${title} — ${file.name}`,
          color: accent,
          meta: { bundle: title, source: 'silkbundle' },
        });
        if (pub.ok && pub.id) {
          const urls = shareUrls(pub.id);
          newResults.push({
            name: file.name,
            id: pub.id,
            warn: pub.warn || undefined,
            url: urls.embed,
            thumb,
            size: file.size,
          });
        } else {
          setError(pub.error || 'upload failed for one file');
        }
      } catch (e: any) {
        setError(e?.message || 'upload error');
      }
      setProgress(Math.round(((i + 1) / list.length) * 100));
    }
    setResults(newResults);

    if (newResults.length) {
      const md = `# ${title}\n\n${caption}\n\n## Bundled files\n\n${newResults.map(r => `- [${r.name}](${r.url}) — ${(r.size / 1024).toFixed(1)} KB`).join('\n')}\n\n---\nPublished from Silk Bundle. Soft size warnings only. No hard limits.`;
      const blob = new Blob([md], { type: 'text/markdown' });
      const masterFile = new File([blob], `${title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-bundle.md`, { type: 'text/markdown' });
      try {
        const masterPub = await publishLocalFile(masterFile, {
          caption: caption || `Bundle: ${title}`,
          cardTitle: title,
          color: accent,
          meta: { type: 'bundle', files: newResults.map(r => r.id) },
        });
        if (masterPub.ok && masterPub.id) setMasterId(masterPub.id);
      } catch {}
    }

    setUploading(false);
    setProgress(100);
  }, [addFiles, title, caption, accent]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const onDragLeave = useCallback(() => setDragging(false), []);

  const prettySize = (n: number) => {
    if (n < 1024) return n + ' B';
    if (n < 1048576) return Math.round(n / 1024) + ' KB';
    return (n / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7] font-sans antialiased">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
          className="text-center mb-14"
        >
          <p className="text-[#AF52DE] text-sm tracking-wide mb-3">silk bundle</p>
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight mb-5 leading-[1.02]">gather files<br />into one living share.</h1>
          <p className="text-neutral-400 text-lg max-w-2xl mx-auto leading-relaxed">Shape a title, caption, and accent. Drop local files. Each settles with Apple-style springs and becomes its own permanent Discord-ready link. A master bundle markdown is published alongside them. Soft size warnings only — no hard limits, no boosting. Prior desks remain untouched.</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-4 mb-10 max-w-3xl mx-auto">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Bundle title" className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-[#AF52DE]/50" />
          <input value={caption} onChange={e => setCaption(e.target.value)} placeholder="Caption" className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-[#AF52DE]/50" />
          <input type="color" value={accent} onChange={e => setAccent(e.target.value)} className="h-12 w-full rounded-2xl bg-white/5 border border-white/10 cursor-pointer" />
        </div>

        <motion.div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          animate={{
            scale: dragging ? 1.015 : 1,
            borderColor: dragging ? accent : 'rgba(255,255,255,0.08)',
          }}
          transition={{ type: 'spring', stiffness: 260, damping: 26 }}
          className="relative border-2 border-dashed rounded-3xl p-20 text-center bg-white/[0.025] backdrop-blur-2xl cursor-pointer mb-12"
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
          <AnimatePresence mode="wait">
            {uploading ? (
              <motion.div key="uploading" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="w-20 h-20 mx-auto rounded-full border-2 border-current/30 border-t-current animate-spin" style={{ color: accent }} />
                <p className="text-base text-neutral-300">bundling files… {progress}%</p>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden max-w-sm mx-auto">
                  <motion.div className="h-full" style={{ background: accent }} initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ type: 'spring', stiffness: 80, damping: 20 }} />
                </div>
              </motion.div>
            ) : (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="w-20 h-20 mx-auto mb-6 rounded-3xl flex items-center justify-center" style={{ background: `${accent}22`, color: accent }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 16V4m0 0L8 8m4-4l4 4M4 20h16"/></svg>
                </div>
                <p className="text-2xl font-medium mb-2">Drop files into the bundle</p>
                <p className="text-sm text-neutral-500">or click to browse. Large files may feel slow in the browser — nothing is blocked.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {error && (
          <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center text-sm text-red-400 mb-8">{error}</motion.p>
        )}

        <AnimatePresence>
          {results.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 100, damping: 20 }} className="space-y-6">
              {masterId && (
                <div className="glass rounded-2xl p-6 text-center">
                  <p className="text-sm text-neutral-400 mb-3">master bundle link — ships with polished Discord embed</p>
                  <button
                    onClick={() => navigator.clipboard.writeText(shareUrls(masterId).embed)}
                    className="px-6 py-3 rounded-full text-white text-sm font-medium transition"
                    style={{ background: accent }}
                  >
                    copy bundle share
                  </button>
                </div>
              )}
              <p className="text-sm text-neutral-400">individual file links</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {results.map((r, i) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, type: 'spring', stiffness: 140, damping: 18 }}
                    className="glass rounded-2xl p-5 flex flex-col gap-4"
                  >
                    {r.thumb && (
                      <img src={r.thumb} alt="" className="w-full h-36 object-cover rounded-xl" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{r.name}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">{prettySize(r.size)}</p>
                      {r.warn && <p className="text-xs text-amber-400 mt-1">{r.warn}</p>}
                    </div>
                    <button
                      onClick={() => navigator.clipboard.writeText(r.url)}
                      className="mt-auto px-4 py-2.5 rounded-full text-white text-xs font-medium transition self-start"
                      style={{ background: accent }}
                    >
                      copy share link
                    </button>
                  </motion.div>
                ))}
              </div>
              <button onClick={() => navigate('home')} className="mt-8 text-sm text-neutral-500 hover:text-white transition">← back home</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
