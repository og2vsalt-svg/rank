import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function QuoteDeskPage() {
  const { navigate } = useRouter();
  const [quote, setQuote] = useState('');
  const [author, setAuthor] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const publish = async () => {
    if (!quote.trim() || busy) return;
    setBusy(true);
    setError(null);
    setLink(null);
    try {
      const text = author.trim() ? `${quote.trim()}\n\n— ${author.trim()}` : quote.trim();
      const blob = new Blob([text], { type: 'text/plain' });
      const file = new File([blob], 'quote.txt', { type: 'text/plain' });
      const caption = author.trim() ? `Quote by ${author.trim()}` : 'A quiet quote';
      const res = await publishLocalFile(file, {
        caption,
        color: accent,
        cardTitle: caption,
        meta: { desk: 'quotedesk', author: author.trim() || null },
      });
      if (res.ok && res.id) {
        setLink(shareUrls(res.id).app);
      } else {
        setError(res.error || 'Could not publish');
      }
    } catch (e: any) {
      setError(e.message || 'Failed');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 80, damping: 20 }}
          className="glass rounded-[36px] p-8 md:p-12 border border-white/5"
        >
          <p className="text-[13px] font-medium tracking-wide text-[#0A84FF] mb-2">Quote Desk</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3 text-white">Share a quiet line.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Paste a quote, add an author if you like, choose an accent. It becomes a permanent text share with a polished Discord embed. Soft warnings only.
          </p>

          <textarea
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
            placeholder="The quote itself…"
            rows={5}
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-4 focus:outline-none focus:border-white/30 transition resize-none"
          />

          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Author (optional)"
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-6 focus:outline-none focus:border-white/30 transition"
          />

          <div className="flex items-center gap-3 mb-8">
            <label className="text-sm text-neutral-400">Accent</label>
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="w-10 h-10 rounded-full border border-white/20 cursor-pointer bg-transparent"
            />
            <span className="text-xs text-neutral-500 font-mono">{accent}</span>
          </div>

          {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

          <motion.button
            whileTap={{ scale: 0.985 }}
            whileHover={{ scale: 1.005 }}
            onClick={publish}
            disabled={busy || !quote.trim()}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl bg-[#0A84FF]"
            style={{ backgroundColor: accent }}
          >
            {busy ? 'Publishing…' : 'Publish quote'}
          </motion.button>

          {link && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 glass rounded-2xl border border-white/5"
            >
              <p className="text-xs text-neutral-500 mb-1">Share link</p>
              <button
                onClick={() => navigate('share', link.split('/').pop() || '')}
                className="text-sm text-[#0A84FF] break-all text-left"
              >
                {link}
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
