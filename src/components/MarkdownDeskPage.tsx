import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function MarkdownDeskPage() {
  const { navigate } = useRouter();
  const [text, setText] = useState('# Quiet note\n\nWrite markdown here. It becomes a shareable file.');
  const [title, setTitle] = useState('note.md');
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warn, setWarn] = useState<string | null>(null);

  const publish = async () => {
    if (!text.trim() || busy) return;
    const size = new Blob([text]).size;
    setWarn(size > 2_000_000 ? 'Large note may feel slow. No hard limits.' : null);
    setBusy(true);
    try {
      const file = new File([text], title.endsWith('.md') ? title : `${title}.md`, { type: 'text/markdown' });
      const result = await publishLocalFile(file, {
        caption: text.slice(0, 120),
        color: '#AF52DE',
        cardTitle: title,
        meta: { desk: 'markdown' },
      });
      if (result.ok && result.id) {
        setLink(shareUrls(result.id).app);
      } else {
        setError(result.error || 'Upload failed');
      }
    } catch (e: any) {
      setError(e.message);
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 80, damping: 20 }}
          className="glass rounded-[36px] p-8 md:p-12 border border-white/5"
        >
          <p className="text-[13px] font-medium tracking-wide text-[#AF52DE] mb-2">Markdown</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3 text-white">Write. Share as a file.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            A quiet editor for markdown. Publish it as a permanent share with polished Discord embeds. Soft size warnings only.
          </p>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="filename.md"
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white mb-4 focus:outline-none focus:border-white/30"
          />

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={16}
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-4 text-[15px] text-white font-mono placeholder:text-neutral-500 mb-5 focus:outline-none focus:border-white/30 transition resize-none"
          />

          {warn && <p className="text-[13px] text-amber-300/80 mb-4">{warn}</p>}
          {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

          <motion.button
            whileTap={{ scale: 0.985 }}
            whileHover={{ scale: 1.005 }}
            onClick={publish}
            disabled={busy || !text.trim()}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl bg-[#AF52DE]"
          >
            {busy ? 'Sharing…' : 'Share markdown'}
          </motion.button>

          {link && (
            <button
              onClick={() => navigate('share', link.split('/').pop() || '')}
              className="mt-4 block text-sm text-[#AF52DE] underline"
            >
              {link}
            </button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
