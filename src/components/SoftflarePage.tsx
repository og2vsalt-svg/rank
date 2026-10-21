import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVault } from './VaultContext';
import { useRouter } from './Router';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function SoftflarePage() {
  const { addFiles } = useVault();
  const { navigate } = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [links, setLinks] = useState<{name: string; url: string}[]>([]);
  const [warning, setWarning] = useState('');
  const [note, setNote] = useState('');
  const [accent, setAccent] = useState('#FF9F0A');

  const handleFiles = (list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list);
    setFiles(arr);
    const total = arr.reduce((s, f) => s + f.size, 0);
    setWarning(total > 50 * 1024 * 1024 ? 'Chunky batch. Sending may feel slow — never refused.' : '');
  };

  const process = async () => {
    if (!files.length && !note.trim()) return;
    setBusy(true);
    setLinks([]);
    const newLinks: {name: string; url: string}[] = [];
    try {
      if (files.length) await addFiles(files, 'softflare');
      for (const f of files.slice(0, 5)) {
        const res = await publishLocalFile(f, { caption: note || f.name, author: 'softflare', color: accent });
        if (res.ok && res.id) {
          const u = shareUrls(res.id);
          newLinks.push({ name: f.name, url: u.embed });
        }
      }
      if (note.trim() && !files.length) {
        const blob = new Blob([note], { type: 'text/plain' });
        const file = new File([blob], 'note.txt');
        const res = await publishLocalFile(file, { caption: note, author: 'softflare', color: accent });
        if (res.ok && res.id) {
          const u = shareUrls(res.id);
          newLinks.push({ name: 'note', url: u.embed });
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
    <div className="mesh min-h-screen relative overflow-hidden">
      <Navbar />
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 40 + i * 60,
              height: 40 + i * 60,
              border: `1px solid ${accent}55`,
              background: 'transparent',
            }}
            animate={{
              scale: [0.6, 1.8, 0.6],
              opacity: [0.8, 0, 0.8],
            }}
            transition={{
              duration: 3.5 + i * 0.6,
              repeat: Infinity,
              ease: 'easeOut',
              delay: i * 0.4,
            }}
          />
        ))}
        <motion.div
          className="absolute w-4 h-4 rounded-full"
          style={{ background: accent, boxShadow: `0 0 30px ${accent}` }}
          animate={{ scale: [1, 1.4, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto relative z-10">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#FF9F0A] text-sm font-medium mb-3 tracking-wide">softflare</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mb-4">quiet flaring light.</h1>
          <p className="text-neutral-400 text-lg mb-8">Drop files or leave a note. Soft flares of light gently expand and fade in your accent color, like quiet bursts. Spring motion, glass surfaces. Each lands in storage and the public_shares table. Discord embeds on every link. Large files warned, never refused.</p>
        </motion.div>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
          className="glass rounded-3xl p-10 text-center apple-card mb-5 cursor-pointer"
          onClick={() => fileRef.current?.click()}
        >
          <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
          <div className="text-5xl mb-3 opacity-60">✨</div>
          <p className="text-white font-medium">Drop files or just write</p>
          <p className="text-sm text-neutral-500 mt-1">Flares expand in your color</p>
          {files.length > 0 && <p className="mt-3 text-sm" style={{ color: accent }}>{files.length} selected</p>}
        </div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="shared note (optional, or alone)"
          rows={3}
          className="w-full mb-4 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#FF9F0A]/50 resize-none"
        />

        <div className="flex items-center gap-3 mb-4">
          <label className="text-sm text-neutral-400">accent</label>
          <input
            type="color"
            value={accent}
            onChange={(e) => setAccent(e.target.value)}
            className="w-10 h-10 rounded-xl border border-white/10 bg-transparent cursor-pointer"
          />
          <span className="text-xs text-neutral-500">{accent}</span>
        </div>

        {warning && <p className="text-amber-300 text-sm mb-4 text-center">{warning}</p>}

        <div className="flex justify-center gap-3 mb-8">
          <button onClick={process} disabled={(!files.length && !note.trim()) || busy} className="px-6 py-3 rounded-full bg-white text-black font-medium disabled:opacity-40 active:scale-95 transition">
            {busy ? 'processing…' : 'flare & share'}
          </button>
          <button onClick={() => navigate('vault')} className="px-6 py-3 rounded-full glass">vault</button>
        </div>

        <AnimatePresence>
          {links.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              {links.map((l) => (
                <div key={l.url} className="glass rounded-2xl p-4">
                  <p className="text-sm text-white truncate mb-1">{l.name}</p>
                  <code className="text-xs break-all" style={{ color: accent }}>{l.url}</code>
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
