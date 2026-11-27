import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

type Asset = {
  id: string;
  file: File;
  note: string;
  published?: { url: string; warn?: string };
};

export default function QuietHorizonStudioPage() {
  const { navigate } = useRouter();
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState<{ url: string; warn?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFiles = useCallback((list: FileList | null) => {
    if (!list) return;
    const next: Asset[] = Array.from(list).map((f) => ({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      file: f,
      note: '',
    }));
    setAssets((prev) => [...prev, ...next]);
  }, []);

  const updateNote = (id: string, note: string) => {
    setAssets((prev) => prev.map((a) => (a.id === id ? { ...a, note } : a)));
  };

  const remove = (id: string) => setAssets((prev) => prev.filter((a) => a.id !== id));

  const publishStudio = useCallback(async () => {
    if (!title.trim() && !caption.trim() && assets.length === 0) {
      setError('add a title, caption, or some files');
      return;
    }
    setPublishing(true);
    setError(null);
    setResult(null);
    try {
      // Publish each asset first if present
      const publishedAssets = [];
      for (const asset of assets) {
        if (asset.published) {
          publishedAssets.push(asset);
          continue;
        }
        const pub = await publishLocalFile(asset.file, {
          caption: asset.note || caption || 'from Quiet Horizon Studio',
          cardTitle: asset.file.name,
          color: accent,
          meta: { studio: true },
        });
        if (pub.ok && pub.id) {
          const urls = shareUrls(pub.id);
          publishedAssets.push({
            ...asset,
            published: { url: urls.embed, warn: pub.warn || undefined },
          });
        } else {
          publishedAssets.push(asset);
        }
      }
      setAssets(publishedAssets);

      // Create a markdown summary of the studio
      let md = `# ${title || 'Quiet Horizon'}\n\n${caption || ''}\n\n`;
      publishedAssets.forEach((a, i) => {
        md += `## ${i + 1}. ${a.file.name}\n\n`;
        if (a.note) md += `${a.note}\n\n`;
        if (a.published) md += `[view](${a.published.url})\n\n`;
        if (a.published?.warn) md += `*${a.published.warn}*\n\n`;
      });
      const mdFile = new File([md], `${(title || 'horizon').replace(/[^a-z0-9._-]+/gi, '_') || 'horizon'}.md`, {
        type: 'text/markdown',
      });
      const pub = await publishLocalFile(mdFile, {
        caption: caption || 'Quiet Horizon Studio',
        cardTitle: title || 'Quiet Horizon',
        color: accent,
        meta: { studioSummary: true, assets: publishedAssets.length },
      });
      if (pub.ok && pub.id) {
        const urls = shareUrls(pub.id);
        setResult({ url: urls.embed, warn: pub.warn || undefined });
      } else {
        setError(pub.error || 'could not publish studio');
      }
    } catch (e: any) {
      setError(e?.message || 'something went quiet');
    }
    setPublishing(false);
  }, [title, caption, accent, assets]);

  const prettySize = (n: number) => {
    if (n < 1024) return n + ' B';
    if (n < 1048576) return Math.round(n / 1024) + ' KB';
    return (n / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7] font-sans antialiased">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
          className="text-center mb-12"
        >
          <p className="text-[#0A84FF] text-sm tracking-wide mb-3">quiet horizon studio</p>
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight mb-4 leading-[1.02]">shape a quiet horizon.</h1>
          <p className="text-neutral-400 text-lg leading-relaxed max-w-2xl mx-auto">
            Compose a title, caption, and accent. Drop local files. Preview the living Discord embed. Publish a polished permanent share. Soft size warnings only — no hard limits, no boosting. Apple-style springs on frosted glass. Prior desks remain untouched.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.06, type: 'spring', stiffness: 100, damping: 20 }}
            className="glass rounded-3xl p-8 space-y-6"
          >
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="horizon title"
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3.5 text-lg focus:outline-none focus:border-[#0A84FF]/50 transition"
            />
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="a quiet caption…"
              rows={4}
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-base leading-relaxed focus:outline-none focus:border-[#0A84FF]/50 transition resize-none"
            />
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <span className="text-sm text-neutral-400">accent</span>
                <input
                  type="color"
                  value={accent}
                  onChange={(e) => setAccent(e.target.value)}
                  className="w-10 h-10 rounded-full border border-white/10 cursor-pointer bg-transparent"
                />
              </label>
            </div>

            <div
              onClick={() => inputRef.current?.click()}
              className="border border-dashed border-white/10 rounded-2xl p-6 text-center cursor-pointer hover:border-white/20 transition bg-white/[0.015]"
            >
              <input
                ref={inputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => onFiles(e.target.files)}
              />
              <p className="text-sm text-neutral-400">drop local files</p>
              <p className="text-xs text-neutral-500 mt-1">soft warnings only</p>
            </div>

            <AnimatePresence>
              {assets.map((a) => (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="flex items-center justify-between text-sm bg-white/[0.03] rounded-xl px-4 py-3"
                >
                  <div className="truncate flex-1">
                    <p className="truncate">{a.file.name}</p>
                    <p className="text-xs text-neutral-500">
                      {prettySize(a.file.size)}
                      {a.file.size > 40 * 1024 * 1024 ? ' · large — may feel slow' : ''}
                    </p>
                  </div>
                  <button onClick={() => remove(a.id)} className="text-xs text-neutral-500 hover:text-white ml-3">remove</button>
                </motion.div>
              ))}
            </AnimatePresence>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={publishStudio}
              disabled={publishing}
              className="w-full py-3.5 rounded-full bg-[#0A84FF] text-white text-sm font-medium hover:bg-[#3A9DFF] transition disabled:opacity-50"
            >
              {publishing ? 'publishing…' : 'publish quiet horizon'}
            </motion.button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08, type: 'spring', stiffness: 100, damping: 20 }}
            className="space-y-6"
          >
            <p className="text-sm text-neutral-400 text-center">live Discord embed preview</p>
            <div
              className="glass rounded-3xl p-6 space-y-4 border-l-4"
              style={{ borderLeftColor: accent }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 grid place-items-center text-xs">rh</div>
                <div>
                  <p className="text-sm font-medium">rankvault</p>
                  <p className="text-xs text-neutral-500">just now</p>
                </div>
              </div>
              <h3 className="text-lg font-semibold">{title || 'untitled horizon'}</h3>
              <p className="text-sm text-neutral-300 leading-relaxed">{caption || 'a quiet caption will appear here'}</p>
              {assets.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {assets.slice(0, 4).map((a) => (
                    <div key={a.id} className="bg-white/5 rounded-xl h-20 grid place-items-center text-xs text-neutral-500 truncate px-2">
                      {a.file.name}
                    </div>
                  ))}
                </div>
              )}
              <div className="h-1 rounded-full" style={{ background: accent, opacity: 0.6 }} />
            </div>

            {error && <p className="text-sm text-red-400 text-center">{error}</p>}

            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass rounded-3xl p-6 text-center space-y-4"
                >
                  <p className="text-sm text-neutral-400">discord-ready link</p>
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
          </motion.div>
        </div>

        <button onClick={() => navigate('home')} className="mt-12 text-sm text-neutral-500 hover:text-white transition block mx-auto">
          ← back home
        </button>
      </div>
    </div>
  );
}
