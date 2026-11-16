import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVault } from './VaultContext';
import { useRouter } from './Router';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function NimbusPage() {
  const { addFiles } = useVault();
  const { navigate } = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [links, setLinks] = useState<{name: string; url: string}[]>([]);
  const [warning, setWarning] = useState('');
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#0A84FF');

  const handleFiles = (list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list);
    setFiles(arr);
    const total = arr.reduce((s, f) => s + f.size, 0);
    setWarning(total > 80 * 1024 * 1024 ? 'Gentle note: this batch may take a moment. Never refused.' : '');
  };

  const process = async () => {
    if (!files.length) return;
    setBusy(true);
    setLinks([]);
    const newLinks: {name: string; url: string}[] = [];
    try {
      await addFiles(files, 'nimbus');
      for (const f of files.slice(0, 6)) {
        const res = await publishLocalFile(f, { caption: caption || f.name, author: 'nimbus', color: accent });
        if (res.ok && res.id) {
          const u = shareUrls(res.id);
          newLinks.push({ name: f.name, url: u.embed });
        }
      }
      setLinks(newLinks);
      if (newLinks[0]) try { await navigator.clipboard.writeText(newLinks[0].url); } catch {}
    } catch (e: any) {
      setWarning(e?.message || 'soft issue');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        >
          <p className="text-[#0a84ff] text-sm font-medium mb-3 tracking-wide">nimbus</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mb-4">soft cloud drop.</h1>
          <p className="text-neutral-400 text-lg mb-8">Local files settle as rising mist on frosted glass. Shared caption, accent color. Publishes to the database. Every link unfurls a polished Discord embed. Soft size warnings only.</p>
        </motion.div>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
          className="glass rounded-3xl p-12 text-center apple-card mb-5 cursor-pointer relative overflow-hidden"
          onClick={() => fileRef.current?.click()}
        >
          <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
          <motion.div 
            className="absolute inset-0 opacity-20"
            style={{ background: `radial-gradient(circle at 50% 80%, ${accent}, transparent 70%)` }}
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="text-5xl mb-3 opacity-60 relative">☁️</div>
          <p className="text-white font-medium relative">Drop files into the nimbus</p>
          <p className="text-sm text-neutral-500 mt-1 relative">They rise gently. No hard limits.</p>
          {files.length > 0 && <p className="mt-3 text-sm relative" style={{ color: accent }}>{files.length} settling</p>}
        </div>

        <div className="flex gap-3 mb-4">
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="shared caption (optional)"
            className="flex-1 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#0a84ff]/50"
          />
          <input
            type="color"
            value={accent}
            onChange={(e) => setAccent(e.target.value)}
            className="w-12 h-12 rounded-2xl border border-white/10 bg-transparent cursor-pointer"
          />
        </div>

        {warning && <p className="text-amber-300 text-sm mb-4 text-center">{warning}</p>}

        <div className="flex justify-center gap-3 mb-8">
          <motion.button 
            onClick={process} 
            disabled={!files.length || busy} 
            whileTap={{ scale: 0.96 }}
            className="px-6 py-3 rounded-full bg-white text-black font-medium disabled:opacity-40"
          >
            {busy ? 'rising…' : 'publish mist'}
          </motion.button>
          <button onClick={() => navigate('vault')} className="px-6 py-3 rounded-full glass">vault</button>
        </div>

        <AnimatePresence>
          {links.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              {links.map((l) => (
                <motion.div key={l.url} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-4">
                  <p className="text-sm text-white truncate mb-1">{l.name}</p>
                  <code className="text-xs break-all" style={{ color: accent }}>{l.url}</code>
                </motion.div>
              ))}
              <p className="text-xs text-neutral-500 text-center">first link copied · Discord ready</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
