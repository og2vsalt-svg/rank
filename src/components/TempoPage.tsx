import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function TempoPage() {
  const [name, setName] = useState('');
  const [dur, setDur] = useState(0);
  const [warn, setWarn] = useState('');
  const [url, setUrl] = useState('');
  const audioRef = useRef<HTMLAudioElement>(null);

  const onFile = (file?: File) => {
    if (!file) return;
    if (url) URL.revokeObjectURL(url);
    setName(file.name);
    setWarn(file.size > 40 * 1024 * 1024 ? 'chunky audio. no limit — this tab just might take a breath.' : '');
    const u = URL.createObjectURL(file);
    setUrl(u);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">tempo</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">listen to a local file without uploading it.</h1>
          <p className="text-neutral-400 text-sm mb-6">not the vault. a quiet preview desk for clips you have not decided to share.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center">
            <input type="file" accept="audio/*,video/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            <p className="text-white font-medium">{name || 'drop audio or video'}</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {url && (
            <div className="mt-6">
              <audio ref={audioRef} src={url} controls className="w-full" onLoadedMetadata={(e) => setDur(e.currentTarget.duration || 0)} />
              <p className="text-xs text-neutral-500 mt-3">{dur ? `${dur.toFixed(1)}s local preview` : 'loading…'}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
