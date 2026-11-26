import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVault } from './VaultContext';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function SilkWeavePage() {
  const { addFiles } = useVault();
  const { navigate } = useRouter();
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<{ name: string; id: string; url: string; thumb?: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (!list.length) return;
    setUploading(true);
    setError(null);
    setResults([]);

    await addFiles(list, 'silkweave');

    const newResults: typeof results = [];
    for (const file of list) {
      let thumb: string | undefined;
      if (file.type.startsWith('image/')) {
        try { thumb = URL.createObjectURL(file); } catch {}
      }
      try {
        const pub = await publishLocalFile(file, {
          caption: note || 'Woven from Silk Weave',
          cardTitle: file.name,
          color: '#64D2FF',
        });
        if (pub.ok && pub.id) {
          const urls = shareUrls(pub.id);
          newResults.push({
            name: file.name,
            id: pub.id,
            url: urls.embed,
            thumb,
          });
        } else {
          setError(pub.error || 'failed');
        }
      } catch (e: any) {
        setError(e?.message || 'error');
      }
    }
    setResults(newResults);
    setUploading(false);
  }, [addFiles, note]);

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7]">
      <div className="max-w-2xl mx-auto px-6 py-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 100, damping: 20 }} className="text-center mb-12">
          <p className="text-[#64D2FF] text-sm mb-2">silk weave</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">weave files into shares</h1>
          <p className="text-neutral-400">Drop images or files. Each becomes a polished Discord embed link. Soft warnings only.</p>
        </motion.div>

        <motion.textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="optional shared caption for all embeds"
          rows={3}
          className="w-full mb-6 bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 text-sm placeholder:text-neutral-600 focus:outline-none focus:border-[#64D2FF]/40"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        />

        <motion.div
          onDrop={(e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files) handleFiles(e.dataTransfer.files); }}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          animate={{ scale: dragging ? 1.015 : 1 }}
          className="border-2 border-dashed border-white/10 rounded-3xl p-10 text-center bg-white/[0.02] backdrop-blur-xl cursor-pointer"
          onClick={() => inputRef.current?.click()}
        >
          <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => e.target.files && handleFiles(e.target.files)} />
          {uploading ? (
            <div className="space-y-3">
              <div className="w-12 h-12 mx-auto border-2 border-[#64D2FF]/30 border-t-[#64D2FF] rounded-full animate-spin" />
              <p className="text-sm text-neutral-400">weaving…</p>
            </div>
          ) : (
            <div>
              <p className="text-lg mb-1">Drop to weave</p>
              <p className="text-sm text-neutral-500">No size limits. Large files may slow the browser.</p>
            </div>
          )}
        </motion.div>

        {error && <p className="mt-4 text-center text-sm text-red-400">{error}</p>}

        <AnimatePresence>
          {results.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-8 space-y-3">
              {results.map((r) => (
                <div key={r.id} className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03]">
                  {r.thumb && <img src={r.thumb} className="w-10 h-10 rounded-lg object-cover" alt="" />}
                  <span className="text-sm flex-1 truncate">{r.name}</span>
                  <button onClick={() => navigator.clipboard.writeText(r.url)} className="text-xs px-3 py-1 rounded-full bg-[#64D2FF] text-black font-medium">copy</button>
                </div>
              ))}
              <button onClick={() => navigate('home')} className="text-sm text-neutral-500 hover:text-white">back</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
