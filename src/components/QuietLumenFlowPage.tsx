import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

type FlowItem = {
  id: string;
  title: string;
  caption: string | null;
  size: number;
  embed: string;
  warn: string | null;
  color: string;
  created: number;
  isNote: boolean;
};

const ACCENTS = ['#0A84FF', '#AF52DE', '#FF9F0A', '#30D158', '#FF375F', '#64D2FF'];

export default function QuietLumenFlowPage() {
  const [items, setItems] = useState<FlowItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [err, setErr] = useState('');
  const [note, setNote] = useState('');
  const [title, setTitle] = useState('');
  const [accent, setAccent] = useState(ACCENTS[0]);
  const fileRef = useRef<HTMLInputElement>(null);

  const publish = useCallback(async (file: File | null, asNote = false) => {
    setBusy(true);
    setErr('');
    try {
      const warnBase = file && file.size > 25 * 1024 * 1024
        ? 'Large file. The flow may feel slow while it settles. No hard limit.'
        : null;

      if (asNote && !file) {
        // note-only: create a tiny text file so it lands in storage + public_shares
        const blob = new Blob([note || 'quiet note'], { type: 'text/plain' });
        const noteFile = new File([blob], `${(title || 'note').slice(0, 40)}.txt`, { type: 'text/plain' });
        const res = await publishLocalFile(noteFile, {
          caption: note || null,
          cardTitle: title || 'quiet note',
          color: accent,
          meta: { desk: 'quietlumenflow', kind: 'note', accent },
        });
        if (res.ok && res.id && res.embed) {
          setItems((prev) => [{
            id: res.id!,
            title: title || 'quiet note',
            caption: note || null,
            size: noteFile.size,
            embed: res.embed!,
            warn: res.warn || null,
            color: accent,
            created: Date.now(),
            isNote: true,
          }, ...prev]);
          setNote('');
          setTitle('');
        } else {
          setErr(res.error || 'note did not settle');
        }
      } else if (file) {
        const res = await publishLocalFile(file, {
          caption: note || null,
          cardTitle: title || file.name,
          color: accent,
          meta: { desk: 'quietlumenflow', kind: 'file', accent },
        });
        if (res.ok && res.id && res.embed) {
          setItems((prev) => [{
            id: res.id!,
            title: title || file.name,
            caption: note || null,
            size: file.size,
            embed: res.embed!,
            warn: res.warn || warnBase,
            color: accent,
            created: Date.now(),
            isNote: false,
          }, ...prev]);
          setNote('');
          setTitle('');
        } else {
          setErr(res.error || 'file did not settle');
        }
      }
    } catch (e: any) {
      setErr(e.message || 'something slowed');
    }
    setBusy(false);
  }, [note, title, accent]);

  const onFiles = useCallback((files: FileList | File[]) => {
    const list = Array.from(files);
    if (!list.length) return;
    list.forEach((f) => publish(f, false));
  }, [publish]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    if (e.dataTransfer.files?.length) onFiles(e.dataTransfer.files);
  };

  return (
    <div className="mesh min-h-screen bg-[#050506]">
      <Navbar />
      <div className="pt-28 pb-32 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 22 }}
          className="text-center mb-10"
        >
          <p className="text-[13px] tracking-widest text-neutral-500 uppercase mb-2">quietlumenflow</p>
          <h1 className="text-[36px] font-semibold tracking-tight text-white mb-3">a quiet flow of light</h1>
          <p className="text-[15px] text-neutral-400 leading-relaxed max-w-md mx-auto">
            Drop local files or leave a note. Each settles into the flow with soft spring motion and frosted glass.
            Files land in storage and the public_shares table. Share links unfurl with polished Discord cards.
            Large files receive only a gentle warning of slowness. Prior desks remain intact.
          </p>
        </motion.div>

        <motion.div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          animate={{ scale: drag ? 1.015 : 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          className={`glass rounded-[28px] p-6 mb-8 border-2 border-dashed transition-colors ${
            drag ? 'border-[#0A84FF]/60 bg-white/8' : 'border-white/10'
          }`}
        >
          <div className="space-y-4">
            <input
              type="text"
              placeholder="title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#0A84FF]/40"
            />
            <textarea
              placeholder="caption or note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#0A84FF]/40 resize-none"
            />
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[12px] text-neutral-500">accent</span>
              {ACCENTS.map((c) => (
                <button
                  key={c}
                  onClick={() => setAccent(c)}
                  className={`w-7 h-7 rounded-full transition-all ${accent === c ? 'ring-2 ring-white/60 scale-110' : 'opacity-70 hover:opacity-100'}`}
                  style={{ background: c }}
                  aria-label={`accent ${c}`}
                />
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => publish(null, true)}
                disabled={busy || (!note && !title)}
                className="flex-1 rounded-full bg-white text-black px-5 py-2.5 text-[14px] font-medium disabled:opacity-40 hover:bg-neutral-100 transition"
              >
                {busy ? 'settling…' : 'leave note'}
              </button>
              <label className="flex-1">
                <span className="block text-center rounded-full bg-[#0A84FF] text-white px-5 py-2.5 text-[14px] font-medium cursor-pointer hover:bg-[#0A84FF]/90 transition">
                  choose local files
                </span>
                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => e.target.files && onFiles(e.target.files)}
                />
              </label>
            </div>
          </div>
          {err && <p className="mt-3 text-[13px] text-red-400 text-center">{err}</p>}
        </motion.div>

        <div className="space-y-3">
          <AnimatePresence>
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 28, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 130, damping: 20, delay: i * 0.03 }}
                className="glass rounded-[22px] p-5 flex items-start gap-4"
                style={{ borderLeft: `3px solid ${item.color}` }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-medium text-white truncate">{item.title}</p>
                  {item.caption && (
                    <p className="text-[13px] text-neutral-400 mt-1 line-clamp-2">{item.caption}</p>
                  )}
                  <p className="text-[12px] text-neutral-500 mt-1.5">
                    {item.isNote ? 'note' : `${(item.size / 1024 / 1024).toFixed(1)} MB`}
                    {item.warn && <span className="text-amber-300/80"> · {item.warn}</span>}
                  </p>
                  <a
                    href={item.embed}
                    className="inline-block mt-2 text-[13px] text-[#0A84FF] hover:underline break-all"
                  >
                    {item.embed.replace(location.origin, '')}
                  </a>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(item.embed)}
                  className="text-[12px] text-neutral-400 hover:text-white px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 transition shrink-0"
                >
                  copy
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          {items.length === 0 && !busy && (
            <p className="text-center text-neutral-600 text-[13px] mt-6">the flow is still. drop a file or leave a note to begin.</p>
          )}
        </div>
      </div>
    </div>
  );
}
