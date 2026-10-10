import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVault } from './VaultContext';
import { useRouter } from './Router';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function AetherPage() {
  const { addFiles } = useVault();
  const { navigate } = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [links, setLinks] = useState<{name: string; url: string}[]>([]);
  const [warning, setWarning] = useState('');
  const [caption, setCaption] = useState('');

  const handleFiles = (list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list);
    setFiles(arr);
    const total = arr.reduce((s, f) => s + f.size, 0);
    setWarning(total > 50 * 1024 * 1024 ? 'Chunky batch. Sending may feel slow — never refused.' : '');
  };

  const process = async () => {
    if (!files.length) return;
    setBusy(true);
    setLinks([]);
    const newLinks: {name: string; url: string}[] = [];
    try {
      await addFiles(files, 'aether');
      for (const f of files.slice(0, 5)) { // soft batch for UX
        const res = await publishLocalFile(f, { caption: caption || f.name, author: 'aether' });
        if (res.ok && res.id) {
          const u = shareUrls(res.id);
          newLinks.push({ name: f.name, url: u.embed });
        }
      }
      setLinks(newLinks);
      if (newLinks[0]) try { await navigator.clipboard.writeText(newLinks[0].url); } catch {}
    } catch (e: any) {
      setWarning(e?.message || 'issue');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0a84ff] text-sm font-medium mb-3 tracking-wide">aether</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mb-4">batch drop, pro cards.</h1>
          <p className="text-neutral-400 text-lg mb-8">Local files into the vault, each published for Discord embeds. Warnings for size only.</p>
        </motion.div>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
          className="glass rounded-3xl p-10 text-center apple-card mb-5 cursor-pointer"
          onClick={() => fileRef.current?.click()}
        >
          <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
          <div className="text-5xl mb-3 opacity-60">☁️</div>
          <p className="text-white font-medium">Drop several files</p>
          <p className="text-sm text-neutral-500 mt-1">Up to a handful get instant share cards</p>
          {files.length > 0 && <p className="mt-3 text-sm text-[#0a84ff]">{files.length} selected</p>}
        </div>

        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="shared caption (optional)"
          className="w-full mb-4 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#0a84ff]/50"
        />

        {warning && <p className="text-amber-300 text-sm mb-4 text-center">{warning}</p>}

        <div className="flex justify-center gap-3 mb-8">
          <button onClick={process} disabled={!files.length || busy} className="px-6 py-3 rounded-full bg-white text-black font-medium disabled:opacity-40 active:scale-95 transition">
            {busy ? 'processing…' : 'drop & card'}
          </button>
          <button onClick={() => navigate('vault')} className="px-6 py-3 rounded-full glass">vault</button>
        </div>

        <AnimatePresence>
          {links.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              {links.map((l) => (
                <div key={l.url} className="glass rounded-2xl p-4">
                  <p className="text-sm text-white truncate mb-1">{l.name}</p>
                  <code className="text-xs text-[#0a84ff] break-all">{l.url}</code>
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
