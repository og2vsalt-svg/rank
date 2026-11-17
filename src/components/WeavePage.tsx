import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

type Item = { file: File; caption: string; color: string; id: string };

export default function WeavePage() {
  const [items, setItems] = useState<Item[]>([]);
  const [shared, setShared] = useState<{ name: string; link: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);

  const onDrop = (list: FileList | null) => {
    if (!list) return;
    const next: Item[] = [];
    for (const file of Array.from(list)) {
      if (file.size > 40 * 1024 * 1024) setWarn('Some files are large. Uploads may feel slow. No hard limits.');
      next.push({
        file,
        caption: '',
        color: '#0A84FF',
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      });
    }
    setItems((p) => [...next, ...p]);
  };

  const publishAll = async () => {
    if (!items.length) return;
    setBusy(true);
    const results: { name: string; link: string }[] = [];
    for (const item of items) {
      const res = await publishLocalFile(item.file, {
        caption: item.caption.trim() || undefined,
        color: item.color,
        cardTitle: item.file.name,
        meta: { desk: 'weave' },
      });
      if (res.ok && res.embed) results.push({ name: item.file.name, link: res.embed });
    }
    setShared(results);
    setItems([]);
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-6 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 110, damping: 22 }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[13px] font-medium tracking-wide text-[#0A84FF] mb-1">Weave</p>
          <h1 className="text-[30px] font-semibold tracking-tight mb-2">Individual threads.</h1>
          <p className="text-neutral-400 text-[15px] leading-relaxed mb-6">
            Drop several local files. Give each its own caption and accent. They publish independently to the database with professional Discord embeds on every link. Soft warnings only. No hard limits.
          </p>

          <label className="block border-2 border-dashed border-white/15 rounded-[24px] p-10 text-center cursor-pointer hover:border-white/25 transition mb-6">
            <p className="text-neutral-300 text-[15px]">Drop files or click to choose</p>
            <input type="file" multiple className="hidden" onChange={(e) => onDrop(e.target.files)} />
          </label>

          {warn && <p className="text-[12px] text-amber-300/90 mb-4">{warn}</p>}

          <div className="space-y-4 mb-6">
            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  className="glass rounded-[20px] p-4 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] truncate">{item.file.name}</span>
                    <input
                      type="color"
                      value={item.color}
                      onChange={(e) => setItems((p) => p.map((i) => i.id === item.id ? { ...i, color: e.target.value } : i))}
                      className="w-8 h-8 rounded-full border-0 cursor-pointer"
                    />
                  </div>
                  <input
                    value={item.caption}
                    onChange={(e) => setItems((p) => p.map((i) => i.id === item.id ? { ...i, caption: e.target.value } : i))}
                    placeholder="Caption for this file…"
                    className="bg-black/20 border border-white/10 rounded-[12px] px-3 py-2 text-[13px] focus:outline-none"
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {items.length > 0 && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={publishAll}
              disabled={busy}
              className="w-full rounded-[18px] py-3.5 text-[15px] font-medium text-white bg-[#0A84FF] disabled:opacity-40"
            >
              {busy ? 'Weaving…' : `Publish ${items.length} file${items.length === 1 ? '' : 's'}`}
            </motion.button>
          )}

          {shared.length > 0 && (
            <div className="mt-8 space-y-2">
              <p className="text-[13px] text-neutral-400 mb-2">Shared</p>
              {shared.map((s) => (
                <a key={s.link} href={s.link} className="block text-[13px] text-[#0A84FF] break-all hover:underline">
                  {s.name} — {s.link}
                </a>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
