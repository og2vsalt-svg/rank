import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function LockDeskPage() {
  const { navigate } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [caption, setCaption] = useState('');
  const [expiry, setExpiry] = useState('');
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [warn, setWarn] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFile = (f: File | null) => {
    setFile(f);
    setLink(null);
    setError(null);
    if (f && f.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview(null);
    }
    setWarn(f && f.size > 50_000_000 ? 'Large files may feel slower. No hard limits.' : null);
  };

  const publish = async () => {
    if (!file || busy) return;
    setBusy(true);
    setError(null);
    try {
      const expiresAt = expiry ? new Date(expiry).toISOString() : null;
      const res = await publishLocalFile(file, {
        caption: caption.trim() || file.name,
        lockPass: password.trim() || undefined,
        expiresAt,
        color: '#0A84FF',
        cardTitle: file.name,
        meta: { desk: 'lockdesk', protected: !!password },
      });
      if (res.ok && res.id) {
        setLink(shareUrls(res.id).app);
      } else {
        setError(res.error || 'Could not share');
      }
    } catch (e: any) {
      setError(e.message || 'Upload failed');
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
          transition={{ type: 'spring', stiffness: 90, damping: 22 }}
          className="glass rounded-[36px] p-8 md:p-12 border border-white/5"
        >
          <p className="text-[13px] font-medium tracking-wide text-[#0A84FF] mb-2">Lock Desk</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3 text-white">Protected shares.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Drop a local file, optionally set a password and expiry. Polished Discord embeds on every link. Soft size warnings only.
          </p>

          <div
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-white/15 rounded-3xl p-12 text-center mb-6 cursor-pointer hover:border-white/30 transition bg-black/20"
          >
            {preview ? (
              <img src={preview} alt="" className="max-h-40 mx-auto rounded-2xl object-cover" />
            ) : (
              <>
                <p className="text-neutral-300 text-[15px]">{file ? file.name : 'Choose a file'}</p>
                <p className="text-neutral-500 text-sm mt-1">or click to browse</p>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0] || null)}
            />
          </div>

          {file && (
            <p className="text-xs text-neutral-500 mb-5 text-center">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
          )}

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Optional password"
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-4 focus:outline-none focus:border-white/30 transition"
          />

          <input
            type="datetime-local"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white mb-4 focus:outline-none focus:border-white/30 transition"
          />

          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Optional caption"
            rows={2}
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-5 focus:outline-none focus:border-white/30 transition resize-none"
          />

          {warn && <p className="text-[13px] text-amber-300/80 mb-5">{warn}</p>}
          {error && <p className="text-[13px] text-red-400 mb-5">{error}</p>}

          {link && (
            <div className="mb-5 p-4 rounded-2xl bg-black/30 border border-white/10">
              <p className="text-xs text-neutral-500 mb-1">Share link</p>
              <button
                onClick={() => navigate('share', link.split('/').pop() || '')}
                className="text-sm text-[#0A84FF] break-all text-left"
              >
                {link}
              </button>
            </div>
          )}

          <motion.button
            whileTap={{ scale: 0.985 }}
            whileHover={{ scale: 1.005 }}
            onClick={publish}
            disabled={busy || !file}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl bg-[#0A84FF]"
          >
            {busy ? 'Securing…' : 'Create protected share'}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
