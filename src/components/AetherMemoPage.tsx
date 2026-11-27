import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publishLocalFile, publishShare, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function AetherMemoPage() {
  const { navigate } = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [file, setFile] = useState<File | null>(null);
  const [thumb, setThumb] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState<{ url: string; warn?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFile = useCallback((f: File | null) => {
    setFile(f);
    if (thumb) URL.revokeObjectURL(thumb);
    if (f && f.type.startsWith('image/')) {
      setThumb(URL.createObjectURL(f));
    } else {
      setThumb(null);
    }
  }, [thumb]);

  const publish = async () => {
    if (!title.trim() && !body.trim() && !file) {
      setError('write a note or drop a file');
      return;
    }
    setPublishing(true);
    setError(null);
    setResult(null);
    try {
      if (file) {
        const pub = await publishLocalFile(file, {
          caption: body.trim() || 'A quiet memo',
          cardTitle: title.trim() || file.name,
          color: accent,
          meta: { memo: true, body: body.trim() },
        });
        if (pub.ok && pub.id) {
          const urls = shareUrls(pub.id);
          setResult({ url: urls.embed, warn: pub.warn || undefined });
        } else {
          setError(pub.error || 'could not publish');
        }
      } else {
        // pure text memo as data url
        const text = `# ${title || 'Memo'}\n\n${body}`;
        const dataUrl = 'data:text/markdown;charset=utf-8,' + encodeURIComponent(text);
        const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        const pub = await publishShare({
          id,
          name: title.trim() || 'memo.md',
          type: 'text/markdown',
          size: text.length,
          dataUrl,
          caption: body.slice(0, 180),
        });
        if (pub.ok && pub.id) {
          const urls = shareUrls(pub.id);
          setResult({ url: urls.embed, warn: pub.warn || undefined });
        } else {
          setError(pub.error || 'could not publish note');
        }
      }
    } catch (e: any) {
      setError(e?.message || 'something quiet went wrong');
    } finally {
      setPublishing(false);
    }
  };

  const prettySize = (n: number) => {
    if (n < 1024) return n + ' B';
    if (n < 1048576) return Math.round(n / 1024) + ' KB';
    return (n / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7] font-sans antialiased">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="text-center mb-12"
        >
          <p className="text-[#0A84FF] text-sm tracking-wide mb-3">aether memo</p>
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight mb-4 leading-[1.02]">a quiet note.<br />share when ready.</h1>
          <p className="text-neutral-400 text-lg max-w-xl mx-auto leading-relaxed">Write a short memo. Optionally drop a local file. Shape the accent. Publish a permanent Discord-ready link. Soft size warnings only — no hard limits, no boosting. Apple-style springs on frosted glass.</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 120, damping: 22, delay: 0.05 }}
            className="space-y-5"
          >
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="title"
              className="w-full px-5 py-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-base outline-none focus:border-[#0A84FF]/50 transition"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="the quiet words…"
              rows={8}
              className="w-full px-5 py-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-sm outline-none focus:border-[#0A84FF]/50 transition resize-none"
            />
            <div className="flex items-center gap-3">
              <label className="text-xs text-neutral-500">accent</label>
              <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full border border-white/10 cursor-pointer bg-transparent" />
              <span className="text-xs text-neutral-400">{accent}</span>
            </div>

            <div
              onClick={() => inputRef.current?.click()}
              className="border border-dashed border-white/10 rounded-2xl p-6 text-center cursor-pointer hover:border-white/20 transition bg-white/[0.015]"
            >
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                onChange={(e) => onFile(e.target.files?.[0] || null)}
              />
              {file ? (
                <div className="space-y-1">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-neutral-500">{prettySize(file.size)}{file.size > 40 * 1024 * 1024 ? ' · large — browser may feel slow' : ''}</p>
                  <button type="button" onClick={(e) => { e.stopPropagation(); onFile(null); }} className="text-xs text-neutral-400 hover:text-white mt-1">remove</button>
                </div>
              ) : (
                <p className="text-sm text-neutral-400">optional local file</p>
              )}
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={publish}
              disabled={publishing}
              className="w-full py-3.5 rounded-full bg-[#0A84FF] text-white text-sm font-medium disabled:opacity-50"
            >
              {publishing ? 'publishing…' : 'publish memo'}
            </motion.button>
            {error && <p className="text-sm text-red-400 text-center">{error}</p>}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 120, damping: 22, delay: 0.1 }}
            className="glass rounded-3xl p-6 sticky top-24"
          >
            <p className="text-xs text-neutral-500 mb-4">live preview</p>
            <div className="rounded-2xl overflow-hidden border border-white/5" style={{ borderTop: `3px solid ${accent}` }}>
              {thumb && <img src={thumb} alt="" className="w-full h-40 object-cover" />}
              <div className="p-5">
                <h3 className="font-medium text-lg mb-2">{title || 'untitled memo'}</h3>
                <p className="text-sm text-neutral-400 whitespace-pre-wrap leading-relaxed">{body || 'your words will appear here.'}</p>
                {file && !thumb && <p className="text-xs text-neutral-500 mt-3">attached: {file.name}</p>}
              </div>
            </div>
            <p className="text-xs text-neutral-500 mt-4">the published link carries a polished Discord embed.</p>
          </motion.div>
        </div>

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-12 text-center space-y-4"
            >
              <p className="text-sm text-neutral-400">memo is live</p>
              <button
                onClick={() => navigator.clipboard.writeText(result.url)}
                className="px-6 py-3 rounded-full bg-white text-black text-sm font-medium"
              >
                copy share link
              </button>
              {result.warn && <p className="text-xs text-amber-400">{result.warn}</p>}
              <button onClick={() => navigate('home')} className="block mx-auto text-sm text-neutral-500 hover:text-white">← back home</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
