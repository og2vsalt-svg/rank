import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function MomentPage() {
  const { navigate } = useRouter();
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warn, setWarn] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFile = useCallback((f: File | null) => {
    setFile(f);
    setPreview(f && f.type.startsWith('image/') ? URL.createObjectURL(f) : null);
    setWarn(f && f.size > 40_000_000 ? 'Large files may feel slower. No hard limits.' : null);
    setLink(null);
    setError(null);
  }, []);

  const publish = async () => {
    if (busy || (!text.trim() && !file)) return;
    setBusy(true);
    setError(null);
    try {
      const caption = text.trim() || (file ? file.name : 'a moment');
      let res;
      if (file) {
        res = await publishLocalFile(file, {
          caption,
          color: '#0A84FF',
          cardTitle: caption.slice(0, 80),
          meta: { desk: 'moment' },
        });
      } else {
        // pure text moment — create a tiny text file
        const blob = new Blob([caption], { type: 'text/plain' });
        const textFile = new File([blob], 'moment.txt', { type: 'text/plain' });
        res = await publishLocalFile(textFile, {
          caption,
          color: '#0A84FF',
          cardTitle: caption.slice(0, 80),
          meta: { desk: 'moment', pureText: true },
        });
      }
      if (res.ok && res.id) {
        setLink(shareUrls(res.id).app);
      } else {
        setError(res.error || 'Could not share');
      }
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 70, damping: 18 }}
          className="glass rounded-[32px] p-8 md:p-10 border border-white/5"
        >
          <p className="text-[13px] font-medium tracking-wide text-[#0A84FF] mb-2">Moment</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3 text-white">A quiet moment.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Share a short thought, a photo, or both. Becomes a permanent link with a polished Discord embed. Soft size warnings only.
          </p>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What's on your mind?"
            rows={4}
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-5 focus:outline-none focus:border-white/30 transition resize-none"
          />

          <div
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-[#0A84FF]/40'); }}
            onDragLeave={(e) => e.currentTarget.classList.remove('ring-2', 'ring-[#0A84FF]/40')}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('ring-2', 'ring-[#0A84FF]/40');
              if (e.dataTransfer.files[0]) onFile(e.dataTransfer.files[0]);
            }}
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-white/15 rounded-3xl p-10 text-center mb-5 cursor-pointer hover:border-white/30 transition bg-black/20"
          >
            {preview ? (
              <img src={preview} alt="preview" className="max-h-48 mx-auto rounded-2xl object-cover" />
            ) : (
              <>
                <p className="text-neutral-300 text-[15px]">Optional image or file</p>
                <p className="text-neutral-500 text-sm mt-1">drop or click</p>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0] || null)}
            />
          </div>

          {file && !preview && (
            <p className="text-sm text-neutral-400 mb-4 truncate">{file.name}</p>
          )}

          {warn && <p className="text-[13px] text-amber-300/80 mb-4">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.985 }}
            whileHover={{ scale: 1.005 }}
            onClick={publish}
            disabled={busy || (!text.trim() && !file)}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl bg-[#0A84FF]"
          >
            {busy ? 'Sharing…' : 'Share moment'}
          </motion.button>

          <AnimatePresence>
            {link && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 glass rounded-2xl p-4 text-center"
              >
                <p className="text-xs text-neutral-500 mb-2">shared</p>
                <button
                  onClick={() => navigate('share', link.split('/').pop() || '')}
                  className="text-sm text-[#0A84FF] break-all"
                >
                  {link}
                </button>
              </motion.div>
            )}
            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-sm text-red-400 text-center">
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
