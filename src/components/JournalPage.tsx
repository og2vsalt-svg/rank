import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function JournalPage() {
  const { navigate } = useRouter();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [warn, setWarn] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFile = (f: File | null) => {
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f && f.type.startsWith('image/') ? URL.createObjectURL(f) : null);
    setWarn(f && f.size > 40_000_000 ? 'Large attachment may take a moment. No hard limits.' : null);
  };

  const publish = async () => {
    if (busy || (!body.trim() && !file)) return;
    setBusy(true);
    try {
      const caption = [date, title.trim() || 'Journal entry', body.trim()].filter(Boolean).join('\n\n');
      let res;
      if (file) {
        res = await publishLocalFile(file, {
          caption,
          color: '#0A84FF',
          cardTitle: title.trim() || `Journal · ${date}`,
          meta: { desk: 'journal', date, title: title.trim() },
        });
      } else {
        // pure text entry as a tiny text file
        const blob = new Blob([caption], { type: 'text/plain' });
        const textFile = new File([blob], `${date}-journal.txt`, { type: 'text/plain' });
        res = await publishLocalFile(textFile, {
          caption,
          color: '#0A84FF',
          cardTitle: title.trim() || `Journal · ${date}`,
          meta: { desk: 'journal', date, title: title.trim() },
        });
      }
      if (res.ok && res.id) {
        setLink(shareUrls(res.id).app);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 22 }}
          className="glass rounded-[36px] p-8 md:p-12 border border-white/5"
        >
          <p className="text-[13px] font-medium tracking-wide text-[#0A84FF] mb-2">Journal</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3 text-white">A quiet page for the day.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Date an entry, write freely, optionally attach a photo or file. Publish once and get a permanent link with a polished Discord embed. Soft size warnings only.
          </p>

          <div className="grid gap-4 mb-6">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-[15px] text-white focus:outline-none focus:border-white/30"
            />
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title (optional)"
              className="bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/30"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="What happened today…"
              rows={8}
              className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/30 resize-none"
            />
          </div>

          <div
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-white/15 rounded-3xl p-8 text-center mb-5 cursor-pointer hover:border-white/30 transition bg-black/20"
          >
            {preview ? (
              <img src={preview} alt="" className="max-h-48 mx-auto rounded-2xl object-cover" />
            ) : (
              <>
                <p className="text-neutral-300 text-[15px]">Attach a photo or file</p>
                <p className="text-neutral-500 text-sm mt-1">optional</p>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0] || null)}
            />
          </div>

          {warn && <p className="text-[13px] text-amber-300/80 mb-5">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.985 }}
            whileHover={{ scale: 1.005 }}
            onClick={publish}
            disabled={busy || (!body.trim() && !file)}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl bg-[#0A84FF]"
          >
            {busy ? 'Publishing…' : 'Publish entry'}
          </motion.button>

          {link && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 glass rounded-2xl p-4 text-center"
            >
              <p className="text-sm text-neutral-400 mb-2">Permanent link</p>
              <button
                onClick={() => navigate('share', link.split('/').pop() || '')}
                className="text-[#0A84FF] text-sm break-all"
              >
                {link}
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
