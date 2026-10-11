import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

const ACCENTS = ['#0A84FF', '#30D158', '#FF9F0A', '#BF5AF2', '#FF375F', '#64D2FF'];

export default function TwilightPage() {
  const { navigate } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState(ACCENTS[0]);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');
  const [err, setErr] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const onPick = (list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    setFile(f);
    setErr('');
    setLink('');
    setWarn(f.size > 40 * 1024 * 1024 ? 'large file — may feel slow while sending. No hard limit.' : '');
    if (f.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview(null);
    }
  };

  const publish = async () => {
    if (!file) return;
    setBusy(true);
    setErr('');
    try {
      const result = await publishLocalFile(file, {
        caption: caption || undefined,
        color: accent,
        cardTitle: (file.name || 'twilight').replace(/\.[^.]+$/, ''),
        meta: { desk: 'twilight', accent },
      });
      if (!result.ok || !result.id) {
        setErr(result.error || 'failed to publish');
        return;
      }
      if (result.warn) setWarn(result.warn);
      const urls = shareUrls(result.id);
      setLink(urls.app);
      try { await navigator.clipboard.writeText(urls.app); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 110, damping: 17 }}
          className="glass rounded-[36px] p-8 sm:p-10 apple-card"
        >
          <p className="text-[#0A84FF] text-sm font-medium mb-2 tracking-wide">twilight</p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-3">a quiet drop at dusk.</h1>
          <p className="text-neutral-400 text-sm sm:text-base mb-8 leading-relaxed">
            Select a local file, add a caption if you like, choose an accent. The file is uploaded to storage and recorded in the database. Discord embeds are professional on all share links. Only warnings for large files that might be slow.
          </p>

          <label
            className="block cursor-pointer rounded-[28px] border border-dashed border-white/12 hover:border-[#0A84FF]/40 bg-white/[0.02] p-10 text-center transition duration-500"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onPick(e.dataTransfer.files); }}
            onClick={() => inputRef.current?.click()}
          >
            <input ref={inputRef} type="file" className="hidden" onChange={(e) => onPick(e.target.files)} />
            <AnimatePresence mode="wait">
              {preview ? (
                <motion.img
                  key="img"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  src={preview}
                  alt=""
                  className="mx-auto max-h-48 rounded-2xl object-cover shadow-2xl"
                />
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <p className="text-white font-medium">{file ? file.name : 'click or drop a file'}</p>
                  <p className="text-xs text-neutral-500 mt-2">no hard size limits</p>
                </motion.div>
              )}
            </AnimatePresence>
          </label>

          {file && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-8 space-y-5">
              <input
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="optional caption"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-[#0A84FF]/40 transition"
              />
              <div className="flex gap-2.5 flex-wrap">
                {ACCENTS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setAccent(c)}
                    className={`w-9 h-9 rounded-full transition ${accent === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#050506] scale-110' : 'opacity-70 hover:opacity-100'}`}
                    style={{ background: c }}
                  />
                ))}
              </div>
              <button
                onClick={publish}
                disabled={busy}
                className="w-full py-3.5 rounded-full bg-[#0A84FF] text-white text-sm font-medium hover:bg-[#409CFF] disabled:opacity-50 transition"
              >
                {busy ? 'publishing…' : 'publish twilight'}
              </button>
            </motion.div>
          )}

          {warn && <p className="text-xs text-amber-300/80 mt-5">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-5">{err}</p>}
          {link && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 space-y-3">
              <p className="text-xs text-neutral-400 break-all">copied: {link}</p>
              <div className="flex gap-2">
                <button onClick={() => navigate('share', link.split('/s/').pop() || '')} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">open share</button>
                <button onClick={() => navigate('glimmer')} className="px-5 py-2.5 rounded-full bg-white/5 text-sm">recent shares</button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
