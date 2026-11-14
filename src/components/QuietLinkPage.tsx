import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function QuietLinkPage() {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [color, setColor] = useState('#0A84FF');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<{ id: string; embed: string } | null>(null);
  const [error, setError] = useState('');

  const share = async () => {
    if (!url.trim()) return;
    setStatus('uploading');
    setError('');
    try {
      const note = `link: ${url}\n${title ? 'title: ' + title : ''}\n${description ? 'desc: ' + description : ''}\n${imageUrl ? 'image: ' + imageUrl : ''}`;
      const blob = new Blob([note], { type: 'text/plain' });
      const file = new File([blob], (title || 'link') + '.txt', { type: 'text/plain' });

      const res = await publishLocalFile(file, {
        caption: description || url,
        color,
        cardTitle: title || 'Shared link',
        author: 'rankvault',
        meta: {
          kind: 'link',
          target: url,
          ogImage: imageUrl || null,
        },
      });

      if (!res.ok || !res.id) {
        setError(res.error || 'could not publish');
        setStatus('error');
        return;
      }

      const urls = shareUrls(res.id);
      setResult({ id: res.id, embed: urls.embed });
      setStatus('done');
    } catch (e: any) {
      setError(e?.message || 'something went wrong');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0b0d] text-white pt-24 px-5 pb-16">
      <div className="max-w-xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-semibold tracking-tight mb-2"
        >
          quiet link
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-neutral-400 mb-8"
        >
          Share any URL with a polished Discord embed. Set a custom title, description, and optional image. Soft warnings only. No hard limits. All prior desks remain fully intact.
        </motion.p>

        <div className="space-y-4">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full glass rounded-2xl px-4 py-3 text-sm outline-none"
          />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="card title (optional)"
            className="w-full glass rounded-2xl px-4 py-3 text-sm outline-none"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="description for the Discord card"
            rows={3}
            className="w-full glass rounded-2xl px-4 py-3 text-sm outline-none resize-none"
          />
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="optional image URL for the embed"
            className="w-full glass rounded-2xl px-4 py-3 text-sm outline-none"
          />

          <div className="flex items-center gap-3">
            <label className="text-xs text-neutral-400">accent</label>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-10 rounded-full border-0" />
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={share}
            disabled={!url.trim() || status === 'uploading'}
            className="w-full py-3 rounded-full bg-[#0A84FF] text-white font-medium disabled:opacity-50"
          >
            {status === 'uploading' ? 'publishing…' : 'create embed link'}
          </motion.button>
        </div>

        <AnimatePresence>
          {status === 'done' && result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 glass rounded-2xl p-5"
            >
              <p className="text-sm font-medium mb-2">ready</p>
              <p className="text-xs text-neutral-400 break-all mb-3">{result.embed}</p>
              <button
                onClick={() => navigator.clipboard.writeText(result.embed)}
                className="text-xs text-[#0A84FF]"
              >
                copy Discord link
              </button>
            </motion.div>
          )}
          {status === 'error' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-red-400 text-sm">
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
