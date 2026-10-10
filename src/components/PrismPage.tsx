import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from './Router';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function PrismPage() {
  const { navigate } = useRouter();
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#0A84FF');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ id: string; warn?: string | null; url: string } | null>(null);
  const [error, setError] = useState('');

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  }, []);

  const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const share = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const res = await publishLocalFile(file, { caption, color, cardTitle: file.name });
      if (res.ok && res.id && res.url) {
        setResult({ id: res.id, warn: res.warn, url: res.url });
      } else {
        setError(res.error || 'could not publish');
      }
    } catch (e: any) {
      setError(e.message || 'failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen mesh">
      <Navbar />
      <main className="pt-28 pb-20 px-4 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="glass rounded-3xl p-8 md:p-10"
        >
          <h1 className="text-3xl font-semibold tracking-tight mb-2">Prism</h1>
          <p className="text-neutral-400 mb-8 leading-relaxed">
            Drop a local file. It lands in the share table with a color accent. Discord unfurls the card. Large files are warned, never refused.
          </p>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
              dragging ? 'border-white/40 bg-white/5' : 'border-white/10'
            }`}
          >
            <input type="file" onChange={onSelect} className="absolute inset-0 opacity-0 cursor-pointer" />
            <div className="pointer-events-none">
              {file ? (
                <div>
                  <div className="text-lg font-medium">{file.name}</div>
                  <div className="text-sm text-neutral-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                </div>
              ) : (
                <div className="text-neutral-400">drop a file or click</div>
              )}
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="optional caption"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-white/30"
            />
            <div className="flex items-center gap-3">
              <label className="text-sm text-neutral-400">accent</label>
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-10 rounded-lg border-0 cursor-pointer" />
            </div>
          </div>

          <button
            onClick={share}
            disabled={!file || uploading}
            className="mt-8 w-full py-3.5 rounded-full bg-white text-black font-medium disabled:opacity-40 transition active:scale-[0.98]"
          >
            {uploading ? 'publishing…' : 'publish prism'}
          </button>

          {error && <p className="mt-4 text-red-400 text-sm">{error}</p>}

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="mt-8 p-6 rounded-2xl bg-white/5 border border-white/10"
              >
                <div className="text-sm text-neutral-400 mb-2">shared</div>
                <a href={shareUrls(result.id).app} className="text-white underline break-all">
                  {shareUrls(result.id).app}
                </a>
                {result.warn && <p className="mt-3 text-amber-400 text-sm">{result.warn}</p>}
                <div className="mt-4 flex gap-2">
                  <button onClick={() => navigate('share', result.id)} className="text-xs px-4 py-2 rounded-full bg-white/10 hover:bg-white/15">
                    open share
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>
    </div>
  );
}
