import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

type FileWithCaption = { file: File; caption: string };

export default function TapestryPage() {
  const [items, setItems] = useState<FileWithCaption[]>([]);
  const [story, setStory] = useState('');
  const [accent, setAccent] = useState('#AF52DE');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [err, setErr] = useState('');

  const onFiles = (list: FileList | null) => {
    const arr = list ? Array.from(list) : [];
    setItems(arr.map((file) => ({ file, caption: '' })));
    const big = arr.some((f) => f.size > 40 * 1024 * 1024);
    setWarn(big ? 'one or more large files. the browser may feel slow while sending. no hard limit — only a gentle warning.' : '');
  };

  const updateCaption = (index: number, caption: string) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, caption } : item)));
  };

  const publish = async () => {
    if (!items.length) {
      setErr('add at least one file to the tapestry');
      return;
    }
    setBusy(true);
    setErr('');
    setLinks([]);
    const newLinks: string[] = [];
    try {
      for (const item of items) {
        const res = await publishLocalFile(item.file, {
          caption: item.caption.trim() || story.trim() || 'woven into the tapestry',
          cardTitle: item.file.name,
          color: accent,
          meta: { desk: 'tapestry', accent, story: story.trim() || null, individualCaption: item.caption.trim() || null },
        });
        if (!res.ok || !res.id) {
          setErr(res.error || 'publish failed for ' + item.file.name);
          return;
        }
        if (res.warn) setWarn(res.warn);
        const urls = shareUrls(res.id);
        newLinks.push(urls.app);
      }
      setLinks(newLinks);
      try {
        await navigator.clipboard.writeText(newLinks.join('\n'));
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
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 18 }}
          className="glass rounded-[36px] p-8 relative overflow-hidden"
        >
          <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-25" style={{ background: accent }} />
          <p className="text-sm mb-2 tracking-wide" style={{ color: accent }}>tapestry</p>
          <h1 className="text-3xl font-semibold mb-3 tracking-tight">weave files into a shared narrative.</h1>
          <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
            Drop files and give each its own thread caption. A quiet overarching story travels with the whole. Every piece lands in the database with polished Discord embeds. Large files warned, never refused. Prior desks stay intact.
          </p>

          <div className="flex items-center gap-3 mb-4">
            <label className="text-xs text-neutral-400">thread color</label>
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-xl border border-white/10 bg-transparent cursor-pointer" />
            <span className="text-xs text-neutral-500 font-mono">{accent}</span>
          </div>

          <textarea
            value={story}
            onChange={(e) => setStory(e.target.value)}
            placeholder="optional overarching story that binds the tapestry"
            rows={2}
            className="w-full mb-4 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm placeholder:text-neutral-500 focus:outline-none transition resize-none"
          />

          <label
            className="block cursor-pointer rounded-2xl border border-dashed border-white/15 hover:border-white/30 p-8 text-center transition mb-4"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              onFiles(e.dataTransfer.files);
            }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-sm text-neutral-300">
              {items.length ? `${items.length} threads ready` : 'drop or click to begin the weave'}
            </p>
          </label>

          <AnimatePresence>
            {items.length > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-4 space-y-3">
                {items.map((item, i) => (
                  <div key={i} className="glass rounded-2xl p-3">
                    <p className="text-xs text-neutral-400 truncate mb-1">{item.file.name} · {(item.file.size / 1024 / 1024).toFixed(1)} MB</p>
                    <input
                      value={item.caption}
                      onChange={(e) => updateCaption(i, e.target.value)}
                      placeholder="caption for this thread"
                      className="w-full px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs placeholder:text-neutral-600 focus:outline-none"
                    />
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.015 }}
            onClick={publish}
            disabled={busy || !items.length}
            className="w-full py-3 rounded-full text-white text-sm font-medium disabled:opacity-50 transition"
            style={{ background: accent }}
          >
            {busy ? 'weaving…' : 'publish tapestry'}
          </motion.button>

          {links.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 text-xs text-neutral-400 space-y-1">
              <p>copied share links (Discord embeds ready):</p>
              {links.map((l, i) => (
                <p key={i} className="break-all">{l}</p>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
