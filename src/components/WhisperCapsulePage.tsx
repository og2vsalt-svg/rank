import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function WhisperCapsulePage() {
  const { navigate } = useRouter();
  const [title, setTitle] = useState('Whisper Capsule');
  const [message, setMessage] = useState('');
  const [caption, setCaption] = useState('opens when the time is right');
  const [color, setColor] = useState('#FF9F0A');
  const [unlockAt, setUnlockAt] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const publish = async () => {
    if (!message.trim() && !file) {
      setError('write a whisper or attach a file');
      return;
    }
    setPublishing(true);
    setError(null);
    setResult(null);

    const unlockIso = unlockAt ? new Date(unlockAt).toISOString() : null;
    const body = [
      `# ${title}`,
      '',
      caption,
      '',
      unlockIso ? `> unlocks at ${unlockIso}` : '> open now',
      '',
      message.trim() || '_(no message — see attachment)_',
      '',
      '---',
      'shared from rankvault · Discord-ready',
    ].join('\n');

    try {
      if (file) {
        const pub = await publishLocalFile(file, {
          caption,
          cardTitle: title,
          color,
          meta: { unlockAt: unlockIso, kind: 'whisper-capsule', message: message.trim() || null },
        });
        if (pub.ok && pub.id) {
          const url = shareUrls(pub.id).embed;
          setResult(url);
          navigator.clipboard.writeText(url).catch(() => {});
        } else {
          setError(pub.error || 'capsule could not seal');
        }
      } else {
        const blob = new Blob([body], { type: 'text/markdown' });
        const md = new File([blob], `${title.replace(/\s+/g, '-')}.md`, { type: 'text/markdown' });
        const pub = await publishLocalFile(md, {
          caption,
          cardTitle: title,
          color,
          meta: { unlockAt: unlockIso, kind: 'whisper-capsule' },
        });
        if (pub.ok && pub.id) {
          const url = shareUrls(pub.id).embed;
          setResult(url);
          navigator.clipboard.writeText(url).catch(() => {});
        } else {
          setError(pub.error || 'capsule could not seal');
        }
      }
    } catch (e: any) {
      setError(e?.message || 'seal interrupted');
    }
    setPublishing(false);
  };

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7]">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
          className="text-center mb-12"
        >
          <p className="text-[#FF9F0A] text-sm tracking-wide mb-3">whisper capsule</p>
          <h1 className="text-5xl font-semibold tracking-tight mb-4 leading-[1.02]">
            a note that waits
            <br />
            for its moment.
          </h1>
          <p className="text-neutral-400 text-lg max-w-xl mx-auto">
            Write a quiet message, optionally attach a local file, and set when it should feel open. Publishes as a permanent Discord-ready share. Soft size warnings only.
          </p>
        </motion.div>

        <div className="glass rounded-3xl p-6 space-y-5 mb-8">
          <div>
            <label className="block text-xs text-neutral-500 mb-1.5">title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#FF9F0A]/50"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1.5">caption for Discord</label>
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#FF9F0A]/50"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1.5">whisper</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              placeholder="write something quiet…"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#FF9F0A]/50 resize-none"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-neutral-500 mb-1.5">unlock at (optional)</label>
              <input
                type="datetime-local"
                value={unlockAt}
                onChange={(e) => setUnlockAt(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#FF9F0A]/50"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-1.5">accent</label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full h-12 rounded-2xl cursor-pointer bg-transparent border border-white/10"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1.5">optional file</label>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="w-full border border-dashed border-white/15 rounded-2xl px-4 py-4 text-sm text-neutral-400 hover:border-white/25 transition text-left"
            >
              {file ? file.name : 'attach a local file (optional)'}
            </button>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
        </div>

        <div className="glass rounded-3xl p-5 mb-8">
          <p className="text-xs text-neutral-500 mb-3">live embed preview</p>
          <div className="border-l-4 rounded-2xl p-4 bg-black/40" style={{ borderColor: color }}>
            <p className="font-medium text-sm" style={{ color }}>
              {title || 'Whisper Capsule'}
            </p>
            <p className="text-neutral-400 text-xs mt-1 leading-relaxed">{caption}</p>
            {unlockAt && (
              <p className="text-[10px] text-neutral-500 mt-2">unlocks {new Date(unlockAt).toLocaleString()}</p>
            )}
            <p className="text-[10px] text-neutral-600 mt-3">rankvault · Discord-ready</p>
          </div>
        </div>

        {error && <p className="text-center text-sm text-red-400 mb-4">{error}</p>}

        <button
          onClick={publish}
          disabled={publishing}
          className="px-7 py-3 rounded-full text-sm font-medium text-black disabled:opacity-50"
          style={{ background: color }}
        >
          {publishing ? 'sealing…' : 'seal capsule'}
        </button>

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 glass rounded-2xl p-4 text-sm break-all"
          >
            <p className="text-xs text-neutral-500 mb-1">link copied</p>
            {result}
          </motion.div>
        )}

        <button
          onClick={() => navigate('home')}
          className="mt-12 block text-sm text-neutral-500 hover:text-white transition"
        >
          ← back home
        </button>
      </div>
    </div>
  );
}
