import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function RippleDeskPage() {
  const { navigate } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ link?: string; error?: string; warn?: string | null } | null>(null);
  const [ripples, setRipples] = useState<{ id: string; x: number; y: number }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const zoneRef = useRef<HTMLDivElement>(null);

  const addRipple = useCallback((clientX: number, clientY: number) => {
    if (!zoneRef.current) return;
    const rect = zoneRef.current.getBoundingClientRect();
    const id = Math.random().toString(36).slice(2);
    setRipples((r) => [...r, { id, x: clientX - rect.left, y: clientY - rect.top }]);
    setTimeout(() => setRipples((r) => r.filter((x) => x.id !== id)), 900);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    addRipple(e.clientX, e.clientY);
    const f = e.dataTransfer.files[0];
    if (f) {
      setFile(f);
      setPreview(f.type.startsWith('image/') ? URL.createObjectURL(f) : null);
      setResult(null);
    }
  }, [addRipple]);

  const publish = async () => {
    if (!file || busy) return;
    setBusy(true);
    setResult(null);
    const res = await publishLocalFile(file, {
      caption: caption.trim() || file.name,
      color: '#30D158',
      cardTitle: file.name,
      meta: { desk: 'ripple' },
    });
    if (res.ok && res.id) {
      setResult({ link: shareUrls(res.id).app, warn: res.warn || null });
    } else {
      setResult({ error: res.error || 'could not share' });
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 70, damping: 18 }}
          className="glass rounded-[36px] p-8 md:p-12 border border-white/5 relative overflow-hidden"
        >
          <p className="text-[13px] font-medium tracking-wide text-[#30D158] mb-2">Ripple Desk</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3 text-white">Let it settle.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Drop a local file. A quiet ripple expands around the point of contact. Add a caption and publish a permanent share with polished Discord embeds. Soft size warnings only — nothing is blocked.
          </p>

          <div
            ref={zoneRef}
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            onClick={(e) => {
              addRipple(e.clientX, e.clientY);
              inputRef.current?.click();
            }}
            className="relative border-2 border-dashed border-white/15 rounded-3xl p-20 text-center mb-7 cursor-pointer hover:border-white/30 transition bg-black/20 overflow-hidden"
          >
            <AnimatePresence>
              {ripples.map((r) => (
                <motion.div
                  key={r.id}
                  initial={{ scale: 0, opacity: 0.6 }}
                  animate={{ scale: 6, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute rounded-full border border-[#30D158]/40 pointer-events-none"
                  style={{ left: r.x - 40, top: r.y - 40, width: 80, height: 80 }}
                />
              ))}
            </AnimatePresence>
            {preview ? (
              <img src={preview} alt="" className="mx-auto max-h-48 rounded-2xl object-cover" />
            ) : (
              <>
                <p className="text-neutral-300 text-[15px]">Drop a file or click</p>
                <p className="text-neutral-500 text-sm mt-1">ripple follows your touch</p>
              </>
            )}
            {file && <p className="mt-4 text-sm text-white">{file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB</p>}
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setFile(f);
                  setPreview(f.type.startsWith('image/') ? URL.createObjectURL(f) : null);
                  setResult(null);
                }
              }}
            />
          </div>

          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Quiet caption (optional)"
            rows={2}
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-5 focus:outline-none focus:border-white/30 transition resize-none"
          />

          {result?.warn && <p className="text-[13px] text-amber-300/80 mb-4">{result.warn}</p>}
          {result?.error && <p className="text-[13px] text-red-400 mb-4">{result.error}</p>}
          {result?.link && (
            <button
              onClick={() => navigate('share', result.link!.split('/').pop() || '')}
              className="block w-full text-left text-[#30D158] text-sm mb-4 truncate"
            >
              {result.link}
            </button>
          )}

          <motion.button
            whileTap={{ scale: 0.985 }}
            whileHover={{ scale: 1.005 }}
            onClick={publish}
            disabled={busy || !file}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl bg-[#30D158]"
          >
            {busy ? 'Settling…' : file ? 'Publish the ripple' : 'Drop a file first'}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
