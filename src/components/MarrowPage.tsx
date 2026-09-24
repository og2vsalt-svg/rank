import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';

export default function MarrowPage() {
  const { addFiles } = useVault();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [src, setSrc] = useState('');
  const [name, setName] = useState('');
  const [warn, setWarn] = useState('');
  const [saved, setSaved] = useState('');

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setName(file.name);
    setWarn(file.size > 40 * 1024 * 1024 ? 'long track. encoding might lag. no cap.' : '');
    setSrc(URL.createObjectURL(file));
    const res = await addFiles([file], 'marrow');
    setSaved(res.ok ? 'also parked in your vault under marrow' : res.error || 'vault save skipped');
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">marrow</p>
          <h1 className="text-3xl font-semibold mb-3">listen first, keep if you want.</h1>
          <p className="text-neutral-400 text-sm mb-6">local audio player that can stash the file in vault. not a public share unless you flip it later.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-8 text-center">
            <input type="file" accept="audio/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            <p className="text-white font-medium">drop audio</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {name && <p className="text-sm text-neutral-300 mt-4">{name}</p>}
          {src && <audio ref={audioRef} src={src} controls className="w-full mt-4" />}
          {saved && <p className="text-xs text-neutral-500 mt-3">{saved}</p>}
        </motion.div>
      </div>
    </div>
  );
}
