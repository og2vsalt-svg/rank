import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function VelvetQuillPage() {
  const { navigate } = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ url: string; warn?: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPreview(!!(title || body || file));
  }, [title, body, file]);

  const publish = useCallback(async () => {
    if (!title.trim() && !body.trim() && !file) {
      setError('add a title, some words, or a file');
      return;
    }
    setUploading(true);
    setError(null);
    setResult(null);

    try {
      let targetFile = file;
      if (!targetFile && (title.trim() || body.trim())) {
        const text = `# ${title || 'untitled'}\n\n${body || ''}`.trim();
        targetFile = new File([text], `${(title || 'note').replace(/[^a-z0-9._-]+/gi, '_') || 'note'}.md`, { type: 'text/markdown' });
      }
      if (!targetFile) throw new Error('nothing to share');

      const pub = await publishLocalFile(targetFile, {
        caption: body || title || 'shared from Velvet Quill',
        cardTitle: title || targetFile.name,
        color: accent,
      });

      if (pub.ok && pub.id) {
        const urls = shareUrls(pub.id);
        setResult({
          url: urls.embed,
          warn: pub.warn || undefined,
          name: title || targetFile.name,
        });
      } else {
        setError(pub.error || 'could not publish');
      }
    } catch (e: any) {
      setError(e?.message || 'something went quiet');
    }
    setUploading(false);
  }, [title, body, file, accent]);

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7] font-sans antialiased">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 80, damping: 16 }}
          className="text-center mb-14"
        >
          <p className="text-[#0A84FF] text-sm tracking-wide mb-3">velvet quill</p>
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight mb-4 leading-[1.02]">a quieter note.</h1>
          <p className="text-neutral-400 text-lg leading-relaxed max-w-xl mx-auto">Shape a title and body, optionally attach a local file, and watch the Discord embed form. Publish a permanent share. Soft size warnings only. Apple-style springs on frosted glass.</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, type: 'spring', stiffness: 90, damping: 18 }}
            className="glass rounded-3xl p-8 space-y-6"
          >
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="quiet title"
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3.5 text-lg focus:outline-none focus:border-[#0A84FF]/50 transition"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="words that settle..."
              rows={8}
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-base leading-relaxed focus:outline-none focus:border-[#0A84FF]/50 transition resize-none"
            />

            <div className="flex items-center gap-4 flex-wrap">
              <label className="flex items-center gap-3 cursor-pointer">
                <span className="text-sm text-neutral-400">accent</span>
                <input
                  type="color"
                  value={accent}
                  onChange={(e) => setAccent(e.target.value)}
                  className="w-10 h-10 rounded-full border border-white/10 cursor-pointer bg-transparent"
                />
              </label>
              <button
                onClick={() => inputRef.current?.click()}
                className="text-sm text-neutral-400 hover:text-white transition"
              >
                {file ? file.name : 'attach a file'}
              </button>
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              {file && (
                <button onClick={() => setFile(null)} className="text-xs text-neutral-500 hover:text-white">clear</button>
              )}
            </div>

            {file && file.size > 40 * 1024 * 1024 && (
              <p className="text-xs text-amber-400">large drop. the browser may feel slow while it sends. nothing is blocked.</p>
            )}

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={publish}
              disabled={uploading}
              className="w-full py-3.5 rounded-full bg-[#0A84FF] text-white text-sm font-medium hover:bg-[#3A9DFF] transition disabled:opacity-50"
            >
              {uploading ? 'publishing…' : 'publish velvet quill'}
            </motion.button>
          </motion.div>

          <AnimatePresence>
            {preview && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                className="glass rounded-3xl p-6 space-y-4 self-start"
              >
                <p className="text-xs text-neutral-500 tracking-wide">discord embed preview</p>
                <div className="border-l-4 rounded-lg overflow-hidden" style={{ borderColor: accent }}>
                  <div className="bg-[#2b2d31] p-4">
                    <p className="text-white font-medium text-sm">{title || 'untitled'}</p>
                    <p className="text-neutral-300 text-sm mt-1 line-clamp-3">{body || (file ? file.name : 'a quiet note')}</p>
                    {file && <p className="text-xs text-neutral-500 mt-2">{file.name}</p>}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {error && (
            <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center text-sm text-red-400 mt-8">{error}</motion.p>
          )}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-3xl p-8 mt-8 text-center space-y-4"
            >
              <p className="text-sm text-neutral-400">discord-ready link</p>
              <p className="text-lg font-medium">{result.name}</p>
              {result.warn && <p className="text-xs text-amber-400">{result.warn}</p>}
              <button
                onClick={() => navigator.clipboard.writeText(result.url)}
                className="px-6 py-2.5 rounded-full bg-white/10 text-sm hover:bg-white/15 transition"
              >
                copy share link
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <button onClick={() => navigate('home')} className="mt-12 text-sm text-neutral-500 hover:text-white transition block mx-auto">← back home</button>
      </div>
    </div>
  );
}
