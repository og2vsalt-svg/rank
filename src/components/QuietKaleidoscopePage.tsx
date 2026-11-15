import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVault } from './VaultContext';
import { useRouter } from './Router';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function QuietKaleidoscopePage() {
  const { addFiles } = useVault();
  const { navigate } = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [links, setLinks] = useState<{name: string; url: string}[]>([]);
  const [warning, setWarning] = useState('');
  const [caption, setCaption] = useState('');

  const handleFiles = (list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list);
    setFiles(arr);
    const total = arr.reduce((s, f) => s + f.size, 0);
    setWarning(total > 40 * 1024 * 1024 ? 'Intricate batch. May take a moment to refract — never limited.' : '');
    const urls = arr.slice(0, 8).map(f => URL.createObjectURL(f));
    setPreviews(urls);
  };

  const process = async () => {
    if (!files.length) return;
    setBusy(true);
    setLinks([]);
    const newLinks: {name: string; url: string}[] = [];
    try {
      await addFiles(files, 'kaleidoscope');
      for (const f of files.slice(0, 5)) {
        const res = await publishLocalFile(f, { 
          caption: caption || f.name, 
          author: 'kaleidoscope',
          color: '#AF52DE'
        });
        if (res.ok && res.id) {
          const u = shareUrls(res.id);
          newLinks.push({ name: f.name, url: u.embed });
        }
      }
      setLinks(newLinks);
      if (newLinks[0]) try { await navigator.clipboard.writeText(newLinks[0].url); } catch {}
    } catch (e: any) {
      setWarning(e?.message || 'fracture');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, rotate: -2 }} 
          animate={{ opacity: 1, rotate: 0 }} 
          transition={{ type: 'spring', stiffness: 60, damping: 15 }}
        >
          <p className="text-[#AF52DE] text-sm font-medium mb-3 tracking-wide">kaleidoscope</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mb-4">refract, then share.</h1>
          <p className="text-neutral-400 text-lg mb-8">Files turn in mirrored glass before they settle. Soft rotational springs. Shared caption. Polished Discord embeds. Soft warnings only.</p>
        </motion.div>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
          className="glass rounded-3xl p-8 text-center apple-card mb-5 cursor-pointer"
          onClick={() => fileRef.current?.click()}
        >
          <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
          <div className="text-5xl mb-3 opacity-60">🔮</div>
          <p className="text-white font-medium">Drop into the glass</p>
          <p className="text-sm text-neutral-500 mt-1">Previews fold, then publish</p>
          {files.length > 0 && <p className="mt-3 text-sm text-[#AF52DE]">{files.length} facets</p>}
        </div>

        {previews.length > 0 && (
          <div className="relative h-48 mb-6 flex items-center justify-center">
            {previews.map((src, i) => (
              <motion.img
                key={src}
                src={src}
                alt=""
                className="absolute w-20 h-20 object-cover rounded-2xl shadow-lg"
                initial={{ scale: 0, rotate: 0 }}
                animate={{ 
                  scale: 1, 
                  rotate: i * 45,
                  x: Math.cos(i * Math.PI / 4) * 60,
                  y: Math.sin(i * Math.PI / 4) * 60
                }}
                transition={{ type: 'spring', stiffness: 100, damping: 12, delay: i * 0.05 }}
              />
            ))}
          </div>
        )}

        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="shared reflection (optional)"
          className="w-full mb-4 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#AF52DE]/50"
        />

        {warning && <p className="text-amber-300 text-sm mb-4 text-center">{warning}</p>}

        <div className="flex justify-center gap-3 mb-8">
          <button 
            onClick={process} 
            disabled={!files.length || busy} 
            className="px-6 py-3 rounded-full bg-white text-black font-medium disabled:opacity-40 active:scale-95 transition"
          >
            {busy ? 'folding…' : 'publish facets'}
          </button>
          <button onClick={() => navigate('vault')} className="px-6 py-3 rounded-full glass">vault</button>
        </div>

        <AnimatePresence>
          {links.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              {links.map((l) => (
                <div key={l.url} className="glass rounded-2xl p-4">
                  <p className="text-sm text-white truncate mb-1">{l.name}</p>
                  <code className="text-xs text-[#AF52DE] break-all">{l.url}</code>
                </div>
              ))}
              <p className="text-xs text-neutral-500 text-center">first link copied</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
