import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function CapsuleDeskPage() {
  const { navigate } = useRouter();
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [unlockDate, setUnlockDate] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [warn, setWarn] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFile = (f: File | null) => {
    setFile(f);
    if (f && f.size > 50_000_000) setWarn('Large file — may take a moment. No hard limits.');
    else setWarn(null);
  };

  const publish = async () => {
    if (busy || !title.trim()) return;
    setBusy(true);
    try {
      const caption = note.trim() || title;
      const meta = { desk: 'capsule', unlockAt: unlockDate || null, title };
      let res;
      if (file) {
        res = await publishLocalFile(file, {
          caption,
          color: '#AF52DE',
          cardTitle: title,
          meta,
        });
      } else {
        const blob = new Blob([note || title], { type: 'text/plain' });
        const textFile = new File([blob], `${title}.txt`, { type: 'text/plain' });
        res = await publishLocalFile(textFile, {
          caption,
          color: '#AF52DE',
          cardTitle: title,
          meta,
        });
      }
      if (res.ok && res.id) {
        setLink(shareUrls(res.id).app);
      }
    } catch (e) {
      console.error(e);
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 80, damping: 20 }}
          className="glass rounded-[36px] p-8 md:p-12 border border-white/5"
        >
          <p className="text-[13px] font-medium tracking-wide text-[#AF52DE] mb-2">Capsule Desk</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3 text-white">Time-lock a memory.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Seal a note or file until a future date. Soft warnings only. Polished Discord embeds on every link.
          </p>

          <div className="space-y-5">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Capsule title"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-[#AF52DE]/40"
            />
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Quiet note for the future…"
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-[#AF52DE]/40 resize-none"
            />
            <input
              type="datetime-local"
              value={unlockDate}
              onChange={(e) => setUnlockDate(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-[#AF52DE]/40"
            />
            <div
              onClick={() => inputRef.current?.click()}
              className="border-2 border-dashed border-white/10 rounded-2xl p-6 text-center cursor-pointer hover:border-[#AF52DE]/40 transition"
            >
              <p className="text-neutral-400 text-sm">{file ? file.name : 'Optional file (drop or click)'}</p>
              <input ref={inputRef} type="file" className="hidden" onChange={(e) => onFile(e.target.files?.[0] || null)} />
            </div>
            {warn && <p className="text-amber-400 text-sm">{warn}</p>}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={publish}
              disabled={busy || !title.trim()}
              className="w-full py-3 rounded-full bg-[#AF52DE] text-white font-medium disabled:opacity-50"
            >
              {busy ? 'sealing…' : 'seal capsule'}
            </motion.button>
            {link && (
              <div className="mt-4 p-4 bg-white/5 rounded-2xl">
                <p className="text-sm text-neutral-400 mb-2">Share link</p>
                <a href={link} className="text-[#0A84FF] break-all">{link}</a>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
