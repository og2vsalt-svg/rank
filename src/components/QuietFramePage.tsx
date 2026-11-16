import { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function QuietFramePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [warn, setWarn] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onSelect = (f: File | null) => {
    if (!f || !f.type.startsWith('image/')) {
      setWarn('please choose an image.');
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setWarn(f.size > 40 * 1024 * 1024 ? 'large image. framing and upload may feel slower. no hard limit.' : null);
  };

  const publish = useCallback(async () => {
    if (!file) return;
    setBusy(true);
    try {
      const res = await publishLocalFile(file, {
        caption: caption.trim() || 'quiet frame',
        cardTitle: 'Quiet Frame',
        meta: { desk: 'quietframe', kind: 'polaroid' },
      });
      if (res.ok && res.id) {
        setLink(shareUrls(res.id).embed);
      } else {
        setWarn(res.error || 'publish failed');
      }
    } catch (e: any) {
      setWarn(e.message || 'could not publish');
    }
    setBusy(false);
  }, [file, caption]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-6 max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="glass rounded-[32px] p-8 shadow-2xl"
        >
          <h1 className="text-3xl font-semibold tracking-tight text-white mb-2 text-center">Quiet Frame</h1>
          <p className="text-neutral-400 text-sm mb-8 text-center">Drop an image. It settles into a soft polaroid frame and publishes with a polished Discord embed. Soft warnings only.</p>

          <div
            className="relative mx-auto w-full aspect-[3/4] bg-white/5 rounded-3xl border-2 border-dashed border-white/20 flex items-center justify-center cursor-pointer overflow-hidden mb-6"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              onSelect(e.dataTransfer.files[0] || null);
            }}
          >
            {preview ? (
              <img src={preview} alt="preview" className="w-full h-full object-cover" />
            ) : (
              <p className="text-neutral-500 text-sm">drop or click for image</p>
            )}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => onSelect(e.target.files?.[0] || null)} />
          </div>

          {preview && (
            <div className="bg-white text-black rounded-2xl p-4 shadow-xl mb-6 mx-auto max-w-xs">
              <img src={preview} alt="framed" className="w-full rounded-lg mb-3" />
              <p className="text-center text-sm font-medium">{caption || 'quiet frame'}</p>
            </div>
          )}

          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="frame caption"
            className="w-full mb-6 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/30"
          />

          <button
            onClick={publish}
            disabled={busy || !file}
            className="w-full py-3 rounded-full bg-white text-black font-medium text-sm hover:bg-neutral-100 disabled:opacity-50 transition"
          >
            {busy ? 'framing…' : 'publish frame'}
          </button>

          {link && (
            <a href={link} target="_blank" rel="noreferrer" className="block text-center mt-4 text-sm text-blue-400 hover:underline">
              share link
            </a>
          )}
          {warn && <p className="mt-4 text-xs text-amber-400 text-center">{warn}</p>}
        </motion.div>
      </div>
    </div>
  );
}
