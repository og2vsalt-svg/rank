import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

type Drop = {
  id: string;
  name: string;
  url: string;
  embed: string;
  type: string;
};

export default function SoftreelPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [drops, setDrops] = useState<Drop[]>([]);
  const [warn, setWarn] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((list: FileList | File[]) => {
    const arr = Array.from(list);
    setFiles((prev) => [...prev, ...arr]);
    const big = arr.some((f) => f.size > 40 * 1024 * 1024);
    setWarn(big ? 'some files are large. the browser may feel slow while sending.' : null);
  }, []);

  const shareAll = async () => {
    if (!files.length) return;
    setBusy(true);
    setError(null);
    const next: Drop[] = [];
    for (const file of files) {
      const res = await publishLocalFile(file, {
        caption: caption || file.name,
        color,
        cardTitle: file.name,
        meta: { accent: color, source: 'softreel', kind: 'reel' },
      });
      if (res.ok && res.id) {
        next.push({
          id: res.id,
          name: file.name,
          url: res.url || '',
          embed: shareUrls(res.id).embed,
          type: file.type,
        });
      } else {
        setError(res.error || 'one or more files could not be filed');
      }
    }
    setDrops((prev) => [...next, ...prev]);
    setFiles([]);
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-4xl px-5 pb-24 pt-12">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 110, damping: 22 }}>
          <p className="text-[12px] uppercase tracking-[0.18em] text-white/40">softreel</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">let the files play through.</h1>
          <p className="mt-3 text-[15.5px] leading-relaxed text-white/65">
            Drop one or many local files. They land in storage and the public_shares table as a quiet sequence. The reel settles with spring motion. Every share link unfurls a polished Discord card. Large batches warned only for possible slowness. No hard limits. All prior desks remain fully intact.
          </p>
        </motion.div>

        <div
          className="glass mt-8 rounded-[28px] border border-dashed border-white/15 p-8 text-center"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files.length) onDrop(e.dataTransfer.files);
          }}
        >
          <input
            type="file"
            multiple
            className="hidden"
            id="reel-files"
            onChange={(e) => e.target.files && onDrop(e.target.files)}
          />
          <label htmlFor="reel-files" className="cursor-pointer text-[15px] text-white/70">
            drop files here or click to choose
          </label>
          {files.length > 0 && (
            <p className="mt-3 text-[13px] text-white/50">{files.length} file{files.length > 1 ? 's' : ''} ready</p>
          )}
        </div>

        <div className="mt-4 space-y-3">
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="shared note, optional"
            className="glass w-full rounded-2xl px-4 py-3.5 text-[15px] outline-none"
          />
          <div className="flex items-center gap-3">
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-11 w-16 cursor-pointer rounded-xl border border-white/10 bg-transparent" />
            <span className="text-[13px] text-white/50">accent for the cards</span>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.965 }}
          whileHover={{ scale: 1.012 }}
          onClick={shareAll}
          disabled={!files.length || busy}
          className="mt-6 w-full rounded-full px-4 py-3.5 text-[15px] font-medium text-black disabled:opacity-40"
          style={{ background: color }}
        >
          {busy ? 'filing the reel…' : 'share the sequence'}
        </motion.button>

        {warn && <p className="mt-3 text-[12px] text-amber-200/80">{warn}</p>}
        {error && <p className="mt-3 text-[13px] text-red-300">{error}</p>}

        <div className="mt-10">
          <h2 className="text-[18px] font-medium tracking-[-0.02em]">the reel</h2>
          <div className="mt-4 flex gap-4 overflow-x-auto pb-4">
            <AnimatePresence>
              {drops.map((d, i) => (
                <motion.div
                  key={d.id}
                  initial={{ opacity: 0, x: 40, scale: 0.96 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 120, damping: 20, delay: i * 0.04 }}
                  className="glass min-w-[220px] rounded-[24px] p-4"
                >
                  <p className="truncate text-[14px] font-medium">{d.name}</p>
                  <p className="mt-1 truncate text-[12px] text-white/45">{d.embed}</p>
                  <button
                    onClick={() => navigator.clipboard.writeText(d.embed)}
                    className="mt-3 rounded-full bg-white/10 px-3 py-1 text-[12px]"
                  >
                    copy link
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
