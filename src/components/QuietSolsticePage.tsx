import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVault } from './VaultContext';
import { useRouter } from './Router';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function QuietSolsticePage() {
  const { addFiles } = useVault();
  const { navigate } = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [links, setLinks] = useState<{name: string; url: string}[]>([]);
  const [warning, setWarning] = useState('');
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#FF9500');

  const handleFiles = (list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list);
    setFiles(arr);
    const total = arr.reduce((s, f) => s + f.size, 0);
    setWarning(total > 45 * 1024 * 1024 ? 'Substantial gathering. Transit may linger — always accepted.' : '');
  };

  const process = async () => {
    if (!files.length) return;
    setBusy(true);
    setLinks([]);
    const newLinks: {name: string; url: string}[] = [];
    try {
      await addFiles(files, 'solstice');
      for (const f of files.slice(0, 6)) {
        const res = await publishLocalFile(f, { 
          caption: caption || f.name, 
          author: 'solstice',
          color,
          cardTitle: f.name
        });
        if (res.ok && res.id) {
          const u = shareUrls(res.id);
          newLinks.push({ name: f.name, url: u.embed });
        }
      }
      setLinks(newLinks);
      if (newLinks[0]) try { await navigator.clipboard.writeText(newLinks[0].url); } catch {}
    } catch (e: any) {
      setWarning(e?.message || 'the light dimmed');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.96 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ type: 'spring', stiffness: 80, damping: 18 }}
        >
          <p className="text-[#FF9500] text-sm font-medium mb-3 tracking-wide">solstice</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mb-4">longest light, quiet share.</h1>
          <p className="text-neutral-400 text-lg mb-8">Files settle under a turning sun. Soft radial motion, shared caption, chosen warmth. Discord cards on every link. Size notes only.</p>
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
            style={{ background: `radial-gradient(circle at center, ${color} 0%, transparent 70%)` }}
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="text-5xl mb-3 opacity-70 relative z-10">☀️</div>
          <p className="text-white font-medium relative z-10">Drop files into the light</p>
          <p className="text-sm text-neutral-500 mt-1 relative z-10">A handful receive instant share cards</p>
          {files.length > 0 && <p className="mt-3 text-sm relative z-10" style={{ color }}>{files.length} gathering</p>}
        </div>

        <div className="flex gap-3 mb-4">
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="shared note (optional)"
            className="flex-1 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#FF9500]/50"
          />
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 cursor-pointer"
          />
        </div>

        {warning && <p className="text-amber-300 text-sm mb-4 text-center">{warning}</p>}

        <div className="flex justify-center gap-3 mb-8">
          <button 
            onClick={process} 
            disabled={!files.length || busy} 
            className="px-6 py-3 rounded-full bg-white text-black font-medium disabled:opacity-40 active:scale-95 transition"
          >
            {busy ? 'settling…' : 'share the light'}
          </button>
          <button onClick={() => navigate('vault')} className="px-6 py-3 rounded-full glass">vault</button>
        </div>

        <AnimatePresence>
          {links.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              {links.map((l) => (
                <div key={l.url} className="glass rounded-2xl p-4">
                  <p className="text-sm text-white truncate mb-1">{l.name}</p>
                  <code className="text-xs break-all" style={{ color }}>{l.url}</code>
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
