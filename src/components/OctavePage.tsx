import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function OctavePage() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [src, setSrc] = useState('');
  const [rate, setRate] = useState(1);
  const [warn, setWarn] = useState('');

  const onFile = (list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    if (!f.type.startsWith('audio/') && !f.name.match(/\.(mp3|wav|ogg|m4a|flac)$/i)) {
      setWarn('drop audio. other types will just sit there.');
    } else setWarn('');
    if (f.size > 80 * 1024 * 1024) setWarn('huge audio. decode might feel sleepy. still allowed.');
    if (src) URL.revokeObjectURL(src);
    setSrc(URL.createObjectURL(f));
  };

  const apply = (v: number) => {
    setRate(v);
    if (audioRef.current) audioRef.current.playbackRate = v;
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">octave</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">listen at your own speed.</h1>
          <p className="text-neutral-400 text-sm mb-7">local only. nothing leaves the tab. not a file vault, just a quiet player.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 p-10 text-center hover:border-[#0a84ff]/40 transition">
            <input type="file" accept="audio/*" className="hidden" onChange={(e) => onFile(e.target.files)} />
            <p className="text-white text-sm">{src ? 'swap track' : 'drop an audio file'}</p>
          </label>
          {src && (
            <div className="mt-6 space-y-4">
              <audio ref={audioRef} src={src} controls className="w-full" onLoadedMetadata={() => apply(rate)} />
              <div>
                <p className="text-xs text-neutral-500 mb-2">playback {rate.toFixed(2)}x</p>
                <input type="range" min={0.5} max={2} step={0.05} value={rate} onChange={(e) => apply(Number(e.target.value))} className="w-full accent-[#0a84ff]" />
              </div>
            </div>
          )}
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
        </motion.div>
      </div>
    </div>
  );
}
