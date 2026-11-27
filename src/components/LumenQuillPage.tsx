import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVault } from './VaultContext';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';
import Navbar from './Navbar';

export default function LumenQuillPage() {
  const { addFiles } = useVault();
  const { navigate } = useRouter();
  const [title, setTitle] = useState('quiet note');
  const [body, setBody] = useState('');
  const [caption, setCaption] = useState('a lumen quill');
  const [accent, setAccent] = useState('#0A84FF');
  const [file, setFile] = useState<File | null>(null);
  const [thumb, setThumb] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ url: string; warn?: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFile = useCallback((f: File | null) => {
    setFile(f);
    if (thumb) URL.revokeObjectURL(thumb);
    setThumb(f && f.type.startsWith('image/') ? URL.createObjectURL(f) : null);
  }, [thumb]);

  const publish = useCallback(async () => {
    if (!body.trim() && !file) {
      setError('write a note or attach a file');
      return;
    }
    setUploading(true);
    setError(null);
    setResult(null);
    try {
      if (file) {
        await addFiles([file], 'lumenquill');
        const pub = await publishLocalFile(file, {
          caption: caption || body.slice(0, 140) || 'shared from Lumen Quill',
          cardTitle: title || file.name,
          color: accent,
          meta: { body: body.slice(0, 2000) },
        });
        if (pub.ok && pub.id) {
          setResult({
            url: shareUrls(pub.id).embed,
            warn: pub.warn || undefined,
            name: file.name,
          });
        } else {
          setError(pub.error || 'publish failed');
        }
      } else {
        const blob = new Blob([body], { type: 'text/plain' });
        const noteFile = new File([blob], `${(title || 'note').replace(/[^a-z0-9._-]/gi, '_')}.txt`, { type: 'text/plain' });
        await addFiles([noteFile], 'lumenquill');
        const pub = await publishLocalFile(noteFile, {
          caption: caption || body.slice(0, 140),
          cardTitle: title,
          color: accent,
          meta: { body },
        });
        if (pub.ok && pub.id) {
          setResult({
            url: shareUrls(pub.id).embed,
            warn: pub.warn || undefined,
            name: noteFile.name,
          });
        } else {
          setError(pub.error || 'publish failed');
        }
      }
    } catch (e: any) {
      setError(e?.message || 'error');
    }
    setUploading(false);
  }, [file, body, title, caption, accent, addFiles]);

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7] font-sans antialiased">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 pt-28 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
          className="text-center mb-10"
        >
          <p className="text-[#0A84FF] text-sm tracking-wide mb-3">lumen quill</p>
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight mb-4 leading-[1.02]">write quiet.<br />share light.</h1>
          <p className="text-neutral-400 text-lg max-w-xl mx-auto leading-relaxed">
            Compose a note, optionally attach a local file, shape title, caption, and accent. Publish a permanent Discord-ready link. Soft size warnings only — no hard limits. Prior desks remain untouched.
          </p>
        </motion.div>

        <div className="glass rounded-3xl p-6 mb-8 space-y-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="title"
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-white/25"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="write the note…"
            rows={6}
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-white/25 resize-none"
          />
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="caption for the embed"
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-white/25"
          />
          <div className="flex items-center gap-4">
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="h-12 w-16 rounded-2xl bg-black/30 border border-white/10 cursor-pointer"
            />
            <button
              onClick={() => inputRef.current?.click()}
              className="flex-1 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm text-neutral-300 hover:bg-white/10 transition"
            >
              {file ? file.name : 'optional local file'}
            </button>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0] || null)}
            />
          </div>
          {thumb && (
            <motion.img
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              src={thumb}
              alt=""
              className="w-full max-h-48 object-cover rounded-2xl"
            />
          )}
        </div>

        <motion.button
          onClick={publish}
          disabled={uploading}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 300, damping: 22 }}
          className="w-full py-4 rounded-full text-white font-medium mb-8 transition disabled:opacity-50"
          style={{ background: accent }}
        >
          {uploading ? 'publishing…' : 'publish quiet link'}
        </motion.button>

        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-sm text-red-400 mb-6">
            {error}
          </motion.p>
        )}

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 100, damping: 20 }}
              className="glass rounded-3xl p-6 text-center space-y-4"
            >
              <p className="text-sm text-neutral-400">permanent discord-ready link</p>
              <p className="text-base font-medium truncate">{result.name}</p>
              {result.warn && <p className="text-xs text-amber-400">{result.warn}</p>}
              <button
                onClick={() => navigator.clipboard.writeText(result.url)}
                className="px-6 py-2.5 rounded-full text-white text-sm font-medium"
                style={{ background: accent }}
              >
                copy share link
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="text-center mt-12">
          <button onClick={() => navigate('home')} className="text-sm text-neutral-500 hover:text-white transition">
            ← back home
          </button>
        </div>
      </div>
    </div>
  );
}
