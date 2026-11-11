import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVault } from './VaultContext';
import { useRouter } from './Router';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, shareUrls, type CloudMeta } from '../lib/cloudShare';

export default function LumenPulsePage() {
  const { addFiles } = useVault();
  const { navigate } = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState(false);
  const [warning, setWarning] = useState('');
  const [pulseId, setPulseId] = useState<string | null>(null);

  const load = async () => {
    const list = await listPublicShares(48);
    setShares(list);
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, []);

  const handleFile = (f: File | null) => {
    setFile(f);
    setWarning(f && f.size > 50 * 1024 * 1024 ? 'Chunky pulse. Upload may feel slow — never refused.' : '');
  };

  const pulse = async () => {
    if (!file && !caption.trim()) return;
    setBusy(true);
    try {
      if (file) await addFiles([file], 'pulse');
      const res = await publishLocalFile(file || new File([caption], 'pulse.txt', { type: 'text/plain' }), {
        caption: caption || file?.name || 'lumen pulse',
        author: 'pulse',
        cardTitle: caption.slice(0, 50) || 'pulse',
      });
      if (res.ok && res.id) {
        setPulseId(res.id);
        setCaption('');
        setFile(null);
        await load();
        setTimeout(() => setPulseId(null), 3000);
      } else setWarning(res.error || 'pulse failed');
    } catch (e: any) {
      setWarning(e?.message || 'issue');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 90, damping: 18 }}>
          <p className="text-[#0A84FF] text-sm font-medium mb-3 tracking-wide">lumen pulse</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mb-4">feel the recent drops.</h1>
          <p className="text-neutral-400 text-lg mb-8">A living pulse of public shares. Drop a local file or note and watch it join the beat. Discord embeds on every link. Soft warnings only.</p>
        </motion.div>

        <div className="glass rounded-3xl p-6 mb-8 apple-card">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0] || null); }}
            className="border border-dashed border-white/20 rounded-2xl p-6 text-center cursor-pointer mb-4"
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" className="hidden" onChange={(e) => handleFile(e.target.files?.[0] || null)} />
            <p className="text-white">{file ? file.name : 'drop a file to pulse'}</p>
          </div>
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="optional pulse note"
            className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none mb-4"
          />
          {warning && <p className="text-amber-300 text-sm mb-4 text-center">{warning}</p>}
          <motion.button whileTap={{ scale: 0.96 }} onClick={pulse} disabled={busy || (!file && !caption.trim())} className="w-full py-3 rounded-full bg-[#0A84FF] text-white font-medium disabled:opacity-40">
            {busy ? 'pulsing…' : 'send pulse'}
          </motion.button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <AnimatePresence>
            {shares.map((s) => (
              <motion.div
                key={s.id}
                layout
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 140, damping: 18 }}
                className={`glass rounded-2xl p-4 apple-card relative overflow-hidden ${pulseId === s.id ? 'ring-2 ring-[#0A84FF]' : ''}`}
              >
                {pulseId === s.id && (
                  <motion.div
                    className="absolute inset-0 bg-[#0A84FF]/20"
                    initial={{ scale: 0, opacity: 0.8 }}
                    animate={{ scale: 2.5, opacity: 0 }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                  />
                )}
                <p className="text-sm font-medium text-white truncate">{s.caption || s.name}</p>
                <p className="text-xs text-neutral-500 mt-1">{new Date(s.createdAt || '').toLocaleTimeString()}</p>
                <button onClick={() => navigator.clipboard.writeText(shareUrls(s.id).embed)} className="mt-2 text-xs text-[#0A84FF]">copy embed</button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        {!shares.length && <p className="text-neutral-500 text-sm text-center mt-8">waiting for the first pulse.</p>}
      </div>
    </div>
  );
}
