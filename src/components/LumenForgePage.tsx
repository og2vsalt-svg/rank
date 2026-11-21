import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

export default function LumenForgePage() {
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [attachments, setAttachments] = useState<{ file: File; id: string; preview?: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [result, setResult] = useState<{ link?: string; error?: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  useEffect(() => {
    const total = attachments.reduce((s, a) => s + a.file.size, 0) + (text.length * 1.1);
    setWarn(total > 45_000_000 ? 'Large forge load — may feel slower. No hard limits.' : null);
  }, [attachments, text]);

  const addFiles = useCallback((list: FileList | File[]) => {
    const next = Array.from(list).map((file) => ({
      file,
      id: Math.random().toString(36).slice(2, 10),
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));
    setAttachments((p) => [...p, ...next]);
  }, []);

  const publish = async () => {
    if (busy || (!text.trim() && !attachments.length)) return;
    setBusy(true);
    setResult(null);
    try {
      // Primary: turn the text into a shareable file if present
      if (text.trim()) {
        const blob = new Blob([text], { type: 'text/plain' });
        const file = new File([blob], `${(title || 'note').replace(/[^a-z0-9._-]/gi, '_')}.txt`, { type: 'text/plain' });
        const res = await publishLocalFile(file, {
          caption: title || 'LumenForge note',
          cardTitle: title || 'LumenForge',
          color: '#0A84FF',
          meta: { desk: 'lumenforge', words },
        });
        if (!res.ok) throw new Error(res.error || 'text share failed');
        setResult({ link: res.embed });
      }
      // Attachments as separate shares or note them
      for (const att of attachments) {
        const res = await publishLocalFile(att.file, {
          caption: title ? `${title} · attachment` : att.file.name,
          cardTitle: att.file.name,
          color: '#0A84FF',
          meta: { desk: 'lumenforge', parent: title || 'forge' },
        });
        if (res.ok && !result?.link) setResult({ link: res.embed });
      }
    } catch (e: any) {
      setResult({ error: e.message || 'forge failed' });
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 110, damping: 22 }}
          className="glass rounded-[36px] p-8 md:p-10"
        >
          <p className="text-[13px] font-medium tracking-wide text-[#0A84FF] mb-2">Lumen Forge</p>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-3">Forge light into shares.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Draft a note. It becomes a shareable file. Attach anything. Soft size warnings only. Polished Discord embeds on every link. Human-crafted, springy Apple feel.
          </p>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (optional)"
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-4 focus:outline-none focus:border-white/30 transition"
          />

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write the light you want to share…"
            rows={8}
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-2 focus:outline-none focus:border-white/30 transition resize-none"
          />
          <p className="text-xs text-neutral-500 mb-6">{words} words</p>

          <div
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-[#0A84FF]/40'); }}
            onDragLeave={(e) => e.currentTarget.classList.remove('ring-2', 'ring-[#0A84FF]/40')}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('ring-2', 'ring-[#0A84FF]/40');
              if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-white/12 rounded-3xl p-8 text-center mb-6 cursor-pointer hover:border-white/25 transition bg-black/20"
          >
            <p className="text-neutral-300 text-[15px]">Drop attachments</p>
            <p className="text-neutral-500 text-sm mt-1">optional files join the forge</p>
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && addFiles(e.target.files)}
            />
          </div>

          {warn && <p className="text-[13px] text-amber-300/80 mb-5">{warn}</p>}

          <AnimatePresence>
            {attachments.map((att) => (
              <motion.div
                key={att.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="flex items-center gap-3 glass rounded-2xl p-3 mb-2"
              >
                {att.preview ? <img src={att.preview} alt="" className="w-10 h-10 rounded-lg object-cover" /> : <div className="w-10 h-10 rounded-lg bg-white/5 grid place-items-center text-[10px] text-neutral-500">file</div>}
                <p className="text-sm truncate flex-1">{att.file.name}</p>
                <button onClick={() => setAttachments((p) => p.filter((a) => a.id !== att.id))} className="text-xs text-neutral-500 hover:text-white px-2">remove</button>
              </motion.div>
            ))}
          </AnimatePresence>

          <motion.button
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.005 }}
            onClick={publish}
            disabled={busy || (!text.trim() && !attachments.length)}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl mt-4 bg-[#0A84FF]"
          >
            {busy ? 'Forging…' : 'Forge share'}
          </motion.button>

          {result?.link && (
            <motion.a
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              href={result.link}
              target="_blank"
              rel="noreferrer"
              className="block mt-4 text-sm text-[#0A84FF] truncate text-center"
            >
              {result.link}
            </motion.a>
          )}
          {result?.error && <p className="text-sm text-red-400 mt-4 text-center">{result.error}</p>}
        </motion.div>
      </div>
    </div>
  );
}
