import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from './Router';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function SnippetForgePage() {
  const { navigate } = useRouter();
  const [code, setCode] = useState('// drop a quiet snippet\nfunction hello() {\n  return \"rankvault\";\n}');
  const [lang, setLang] = useState('typescript');
  const [title, setTitle] = useState('Quiet snippet');
  const [caption, setCaption] = useState('Shared from Snippet Forge');
  const [accent, setAccent] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ id: string; embed: string; warn?: string } | null>(null);
  const [error, setError] = useState('');

  const sizeWarn = useMemo(() => {
    const bytes = new Blob([code]).size;
    return bytes > 400 * 1024 ? 'long snippet. the browser may feel slow while it packs. no hard limit.' : null;
  }, [code]);

  const publish = async () => {
    if (busy || !code.trim()) return;
    setBusy(true);
    setError('');
    const file = new File([code], `${title.replace(/[^a-z0-9]+/gi, '-').slice(0, 40) || 'snippet'}.${lang === 'typescript' ? 'ts' : lang.slice(0, 4)}`, {
      type: 'text/plain',
    });
    const res = await publishLocalFile(file, {
      cardTitle: title.trim() || 'Snippet',
      caption: caption.trim() || undefined,
      color: accent,
      meta: { lang, source: 'snippetforge' },
    });
    setBusy(false);
    if (!res.ok || !res.id) {
      setError(res.error || 'could not publish');
      return;
    }
    setResult({
      id: res.id,
      embed: res.embed || shareUrls(res.id).embed,
      warn: res.warn || sizeWarn || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7] font-sans antialiased">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <motion.button
          onClick={() => navigate('home')}
          whileTap={{ scale: 0.98 }}
          className="text-xs text-neutral-500 hover:text-white mb-8 transition"
        >
          ← home
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 110, damping: 22 }}
          className="mb-10"
        >
          <p className="text-[#0A84FF] text-sm tracking-wide mb-3">snippet forge</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-4">quiet code.<br />permanent share.</h1>
          <p className="text-neutral-400 text-lg max-w-lg">
            Type or paste a snippet. Shape the title and caption Discord will show. Publish as a clean file to the share database. Soft size warnings only — nothing is refused.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-[1fr_280px] gap-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06, type: 'spring', stiffness: 120, damping: 24 }}
            className="space-y-4"
          >
            <div className="flex gap-2">
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                className="bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:border-white/20"
              >
                {['typescript', 'javascript', 'python', 'rust', 'go', 'css', 'html', 'sql', 'bash', 'json'].map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="snippet title"
                className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-white/20"
              />
            </div>

            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              className="w-full h-72 bg-[#0b0b0d] border border-white/8 rounded-2xl p-4 text-sm font-mono text-neutral-200 outline-none focus:border-white/20 resize-none leading-relaxed"
              placeholder="paste or type…"
            />

            {sizeWarn && (
              <p className="text-xs text-amber-400">{sizeWarn}</p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 120, damping: 24 }}
            className="space-y-4"
          >
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="embed caption"
              rows={3}
              className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-white/20 resize-none"
            />
            <div className="flex items-center gap-3">
              <span className="text-xs text-neutral-500">accent</span>
              <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-8 rounded border-0 bg-transparent cursor-pointer" />
            </div>

            <div className="glass rounded-2xl p-4">
              <p className="text-[11px] text-neutral-500 mb-2">discord preview</p>
              <div className="border-l-4 pl-3" style={{ borderColor: accent }}>
                <p className="font-medium text-sm truncate">{title || 'Snippet'}</p>
                <p className="text-xs text-neutral-400 mt-1 line-clamp-2">{caption || 'Shared from Snippet Forge'}</p>
                <p className="text-[10px] text-neutral-600 mt-2">rankvault · {lang}</p>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              disabled={busy || !code.trim()}
              onClick={publish}
              className="w-full py-3 rounded-full text-sm font-medium text-white disabled:opacity-40 transition"
              style={{ background: accent }}
            >
              {busy ? 'forging…' : 'publish snippet'}
            </motion.button>
          </motion.div>
        </div>

        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-sm text-red-400">{error}</motion.p>
        )}

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-10 glass rounded-3xl p-6"
            >
              <p className="text-sm font-medium mb-1">snippet filed — Discord embed ready</p>
              {result.warn && <p className="text-xs text-amber-400 mb-2">{result.warn}</p>}
              <p className="text-xs text-neutral-500 break-all mb-4">{result.embed}</p>
              <button
                onClick={() => navigator.clipboard.writeText(result.embed)}
                className="px-4 py-1.5 rounded-full bg-white/10 text-xs hover:bg-white/15 transition"
              >
                copy link
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
