import { useState } from 'react';
import { motion } from 'framer-motion';
import { useVault } from './VaultContext';
import { useRouter } from './Router';

export default function MosaicPage() {
  const { addFiles } = useVault();
  const { navigate } = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('untitled mosaic');
  const [warn, setWarn] = useState('');
  const [loading, setLoading] = useState(false);

  const onDrop = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files || []);
    setFiles(list);
    const big = list.some(f => f.size > 20 * 1024 * 1024);
    setWarn(big ? 'large images may load slowly. no hard limit.' : '');
  };

  const share = async () => {
    if (!files.length) return;
    setLoading(true);
    const res = await addFiles(files, 'mosaics');
    setLoading(false);
    if (res.ok && res.ids) {
      // simulate DB share - in real, would call API
      navigate('mosaic', res.ids[0]);
    }
  };

  return (
    <div className="min-h-screen mesh pt-20 pb-12 px-5">
      <div className="max-w-2xl mx-auto">
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-semibold tracking-tight mb-2">mosaic</motion.h1>
        <p className="text-neutral-400 mb-6">arrange local images into a shareable collage. bytes land in the database. Discord cards on the link.</p>
        <div className="glass rounded-3xl p-6 apple-card">
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="mosaic title" className="w-full bg-transparent border-b border-white/10 pb-2 mb-4 text-white outline-none" />
          <label className="block border-2 border-dashed border-white/15 rounded-2xl p-8 text-center cursor-pointer hover:border-white/30 transition">
            <input type="file" multiple accept="image/*" onChange={onDrop} className="hidden" />
            <p className="text-neutral-300">drop images or click to select</p>
            <p className="text-xs text-neutral-500 mt-1">{files.length} selected</p>
          </label>
          {warn && <p className="text-amber-400 text-sm mt-3">{warn}</p>}
          <button onClick={share} disabled={loading || !files.length} className="mt-6 w-full py-3 rounded-full bg-white text-black font-medium disabled:opacity-50">
            {loading ? 'sharing…' : 'share mosaic'}
          </button>
        </div>
        <button onClick={() => navigate('home')} className="mt-4 text-sm text-neutral-500 hover:text-white">back</button>
      </div>
    </div>
  );
}
