import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function SilkMosaicPage() {
  const { navigate } = useRouter();
  const [images, setImages] = useState<{ file: File; url: string; id?: string; share?: string }[]>([]);
  const [title, setTitle] = useState('Silk Mosaic');
  const [caption, setCaption] = useState('woven from local images');
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addImages = useCallback((files: FileList | File[]) => {
    const list = Array.from(files).filter(f => f.type.startsWith('image/'));
    const next = list.map(file => ({ file, url: URL.createObjectURL(file) }));
    setImages(prev => [...prev, ...next]);
  }, []);

  const publishAll = async () => {
    if (!images.length) return;
    setUploading(true);
    const updated = [...images];
    for (let i = 0; i < updated.length; i++) {
      if (updated[i].id) continue;
      try {
        const pub = await publishLocalFile(updated[i].file, {
          caption,
          cardTitle: title,
          color: '#AF52DE',
        });
        if (pub.ok && pub.id) {
          updated[i].id = pub.id;
          updated[i].share = shareUrls(pub.id).embed;
        }
      } catch {}
    }
    setImages(updated);
    setUploading(false);
  };

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7]">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <p className="text-[#AF52DE] text-sm tracking-wide mb-3">silk mosaic</p>
          <h1 className="text-5xl font-semibold tracking-tight mb-4">weave images into a quiet board.</h1>
          <p className="text-neutral-400 max-w-xl mx-auto">Drop local images. Arrange them, then publish each as its own Discord-ready share under one title and caption. Soft warnings only.</p>
        </motion.div>

        <div className="flex flex-wrap gap-4 justify-center mb-8">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="board title" className="bg-white/5 border border-white/10 rounded-full px-5 py-2.5 text-sm outline-none" />
          <input value={caption} onChange={e => setCaption(e.target.value)} placeholder="shared caption" className="bg-white/5 border border-white/10 rounded-full px-5 py-2.5 text-sm outline-none w-72" />
          <button onClick={() => inputRef.current?.click()} className="px-5 py-2.5 rounded-full bg-white/10 text-sm">add images</button>
          <button onClick={publishAll} disabled={uploading || !images.length} className="px-5 py-2.5 rounded-full bg-[#AF52DE] text-white text-sm disabled:opacity-50">{uploading ? 'weaving…' : 'publish all'}</button>
          <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => e.target.files && addImages(e.target.files)} />
        </div>

        <div className="columns-2 md:columns-3 gap-4 space-y-4">
          <AnimatePresence>
            {images.map((img, i) => (
              <motion.div key={img.url} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="break-inside-avoid glass rounded-2xl overflow-hidden">
                <img src={img.url} alt="" className="w-full object-cover" />
                <div className="p-3 flex items-center justify-between text-xs">
                  <span className="truncate text-neutral-400">{img.file.name}</span>
                  {img.share ? (
                    <button onClick={() => navigator.clipboard.writeText(img.share!)} className="text-[#AF52DE]">copy</button>
                  ) : (
                    <span className="text-neutral-600">pending</span>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {!images.length && (
          <div className="text-center text-neutral-500 text-sm mt-20">drop or add images to begin the mosaic</div>
        )}

        <button onClick={() => navigate('home')} className="mt-16 text-sm text-neutral-500 hover:text-white">← back home</button>
      </div>
    </div>
  );
}
