import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

export default function QuietWeavePage() {
  const [notes, setNotes] = useState<string[]>(['']);
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [accent, setAccent] = useState('#AF52DE');
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [warn, setWarn] = useState<string | null>(null);
  const [err, setErr] = useState('');

  const updateNote = (i: number, v: string) => {
    const next = [...notes];
    next[i] = v;
    setNotes(next);
  };

  const weave = async () => {
    const body = notes.map((n) => n.trim()).filter(Boolean).join('\n\n');
    if (!body && !files.length) return setErr('add a note or a file');
    setBusy(true);
    setErr('');
    setLink(null);
    try {
      if (files.length) {
        const f = files[0];
        const res = await publishLocalFile(f, {
          caption: body || 'woven note',
          color: accent,
          cardTitle: title.trim() || f.name,
          meta: { desk: 'quietweave', notes: notes.length },
        });
        if (res.ok && res.embed) setLink(res.embed);
        else setErr(res.error || 'file upload failed');
      } else {
        const blob = new Blob([body], { type: 'text/markdown' });
        const f = new File([blob], `${(title.trim() || 'weave').replace(/\s+/g, '-')}.md`, { type: 'text/markdown' });
        const res = await publishLocalFile(f, {
          caption: 'quiet weave',
          color: accent,
          cardTitle: title.trim() || 'Quiet Weave',
          meta: { desk: 'quietweave' },
        });
        if (res.ok && res.embed) setLink(res.embed);
        else setErr(res.error || 'note publish failed');
      }
    } catch (e: any) {
      setErr(e.message || 'something slowed');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-32 pb-24 px-6 max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 115, damping: 20 }}
          className="glass rounded-[32px] p-8 shadow-2xl"
        >
          <p className="text-[13px] font-medium tracking-wide mb-1" style={{ color: accent }}>Quiet Weave</p>
          <h1 className="text-[28px] font-semibold tracking-tight mb-3">Notes and a file, together.</h1>
          <p className="text-neutral-400 text-[14px] leading-relaxed mb-6">
            Weave short notes. Optionally attach one local file. Publish as a clean share with Discord embed. Soft warnings only. No hard limits. Apple-style springs on frosted glass.
          </p>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full bg-black/20 border border-white/10 rounded-[16px] px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-4 focus:outline-none focus:border-white/20"
          />

          {notes.map((n, i) => (
            <textarea
              key={i}
              value={n}
              onChange={(e) => updateNote(i, e.target.value)}
              placeholder={i === 0 ? 'First note…' : 'Another note…'}
              rows={2}
              className="w-full bg-black/20 border border-white/10 rounded-[16px] px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-2 resize-none focus:outline-none focus:border-white/20"
            />
          ))}

          <button
            type="button"
            onClick={() => setNotes([...notes, ''])}
            className="text-[13px] text-neutral-400 hover:text-white mb-4 transition"
          >
            + add note
          </button>

          <div className="flex items-center gap-4 mb-5">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-9 h-9 rounded-full cursor-pointer border-0" />
            <label className="text-[13px] text-neutral-300 cursor-pointer hover:text-white transition">
              {files[0] ? files[0].name : 'Attach one local file (optional)'}
              <input type="file" className="hidden" onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setFiles(f ? [f] : []);
                setWarn(f && f.size > 40 * 1024 * 1024 ? 'Large file. May feel slow. No hard limit.' : null);
              }} />
            </label>
          </div>

          {warn && <p className="text-[12px] text-amber-300/90 mb-3">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
            onClick={weave}
            disabled={busy}
            className="w-full rounded-[18px] py-3.5 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-lg"
            style={{ background: accent }}
          >
            {busy ? 'Weaving…' : 'Publish weave'}
          </motion.button>

          <AnimatePresence>
            {link && (
              <motion.a
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                href={link}
                className="block mt-5 text-[13px] break-all"
                style={{ color: accent }}
              >
                {link}
              </motion.a>
            )}
            {err && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-[12px] text-red-400">{err}</motion.p>}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
