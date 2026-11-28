import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function PrismAtelierPage() {
  const { navigate } = useRouter();
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [layers, setLayers] = useState<{ id: string; note: string; file?: File; name: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<{ url: string; name: string; warn?: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const addLayer = () => {
    setLayers((prev) => [...prev, { id: Date.now().toString() + Math.random().toString(36).slice(2), note: '', name: 'layer' }]);
  };

  const attachFile = (id: string, files: FileList | null) => {
    if (!files || !files[0]) return;
    const f = files[0];
    setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, file: f, name: f.name } : l)));
  };

  const updateNote = (id: string, note: string) => {
    setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, note } : l)));
  };

  const removeLayer = (id: string) => {
    setLayers((prev) => prev.filter((l) => l.id !== id));
  };

  const publish = useCallback(async () => {
    if (layers.length === 0 && !title.trim()) {
      setError('add a title or at least one layer');
      return;
    }
    setUploading(true);
    setError(null);
    setResults([]);

    try {
      const published: { url: string; name: string; warn?: string }[] = [];

      for (const layer of layers) {
        let targetFile: File;
        const cardTitle = title || layer.name;
        const itemCaption = caption || layer.note || 'from Prism Atelier';

        if (layer.file) {
          targetFile = layer.file;
        } else {
          const text = `# ${cardTitle}\n\n${layer.note || ''}`.trim();
          targetFile = new File([text], `${layer.name.replace(/[^a-z0-9._-]+/gi, '_') || 'layer'}.md`, { type: 'text/markdown' });
        }

        const pub = await publishLocalFile(targetFile, {
          caption: itemCaption,
          cardTitle,
          color: accent,
        });

        if (pub.ok && pub.id) {
          const urls = shareUrls(pub.id);
          published.push({ url: urls.embed, name: cardTitle, warn: pub.warn || undefined });
        }
      }

      if (title.trim() || caption.trim()) {
        const boardText = `# ${title || 'Prism Atelier'}\n\n${caption || ''}\n\n---\n\n${layers.map((l) => `- ${l.name}: ${l.note.slice(0, 80) || 'file'}`).join('\n')}`.trim();
        const boardFile = new File([boardText], `${(title || 'atelier').replace(/[^a-z0-9._-]+/gi, '_') || 'atelier'}.md`, { type: 'text/markdown' });
        const boardPub = await publishLocalFile(boardFile, {
          caption: caption || 'atelier overview',
          cardTitle: title || 'Prism Atelier',
          color: accent,
        });
        if (boardPub.ok && boardPub.id) {
          const urls = shareUrls(boardPub.id);
          published.unshift({ url: urls.embed, name: (title || 'atelier') + ' (overview)', warn: boardPub.warn || undefined });
        }
      }

      setResults(published);
    } catch (e: any) {
      setError(e?.message || 'something went quiet');
    }
    setUploading(false);
  }, [layers, title, caption, accent]);

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7] font-sans antialiased">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
          className="text-center mb-12"
        >
          <p className="text-[#0A84FF] text-sm tracking-wide mb-3">prism atelier</p>
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight mb-4 leading-[1.02]">layer a quiet studio.</h1>
          <p className="text-neutral-400 text-lg leading-relaxed">Gather notes and local files into layered pieces under one title, caption, and accent. They settle with staggered Apple-style springs. Each becomes its own permanent Discord-ready link, plus a clean overview. Soft size warnings only — no hard limits, no boosting.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06, type: 'spring', stiffness: 100, damping: 20 }}
          className="glass rounded-3xl p-8 space-y-6"
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="atelier title"
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3.5 text-lg focus:outline-none focus:border-[#0A84FF]/50 transition"
          />
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="a quiet caption for the whole atelier..."
            rows={3}
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
            <button onClick={addLayer} className="text-sm text-neutral-400 hover:text-white transition">add layer</button>
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {layers.map((layer, i) => (
                <motion.div
                  key={layer.id}
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 140, damping: 20, delay: i * 0.03 }}
                  className="glass rounded-2xl p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <textarea
                      value={layer.note}
                      onChange={(e) => updateNote(layer.id, e.target.value)}
                      placeholder="a quiet note for this layer..."
                      rows={2}
                      className="flex-1 bg-transparent text-sm leading-relaxed focus:outline-none resize-none"
                    />
                    <button onClick={() => removeLayer(layer.id)} className="text-xs text-neutral-500 hover:text-white shrink-0">remove</button>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => document.getElementById(`file-${layer.id}`)?.click()} className="text-xs text-neutral-400 hover:text-white">
                      {layer.file ? layer.name : 'attach local file'}
                    </button>
                    {layer.file && layer.file.size > 40 * 1024 * 1024 && (
                      <span className="text-xs text-amber-400">large — may feel slow</span>
                    )}
                    <input
                      id={`file-${layer.id}`}
                      type="file"
                      className="hidden"
                      onChange={(e) => attachFile(layer.id, e.target.files)}
                    />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={publish}
            disabled={uploading || layers.length === 0}
            className="w-full py-3.5 rounded-full bg-[#0A84FF] text-white text-sm font-medium hover:bg-[#3A9DFF] transition disabled:opacity-50"
          >
            {uploading ? 'publishing atelier…' : 'publish prism atelier'}
          </motion.button>
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center text-sm text-red-400 mt-6">{error}</motion.p>
          )}
          {results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-3xl p-8 mt-8 space-y-4"
            >
              <p className="text-sm text-neutral-400 text-center">discord-ready links</p>
              {results.map((r, i) => (
                <div key={i} className="flex items-center justify-between gap-4 py-2 border-b border-white/5 last:border-0">
                  <span className="text-sm truncate">{r.name}</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(r.url)}
                    className="px-4 py-1.5 rounded-full bg-white/10 text-xs hover:bg-white/15 transition shrink-0"
                  >
                    copy
                  </button>
                </div>
              ))}
              {results.some((r) => r.warn) && <p className="text-xs text-amber-400 text-center mt-2">some drops are large. the browser may feel slow. nothing is blocked.</p>}
            </motion.div>
          )}
        </AnimatePresence>

        <button onClick={() => navigate('home')} className="mt-12 text-sm text-neutral-500 hover:text-white transition block mx-auto">← back home</button>
      </div>
    </div>
  );
}
