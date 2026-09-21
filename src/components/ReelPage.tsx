import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

type Clip = { id: string; name: string; type: string; url: string; size: number };

export default function ReelPage() {
  const [clips, setClips] = useState<Clip[]>([]);
  const [active, setActive] = useState(0);
  const [warn, setWarn] = useState('');

  const current = clips[active];

  const onFiles = (list: FileList | null) => {
    if (!list?.length) return;
    const next: Clip[] = [];
    let heavy = false;
    [...list].forEach((f) => {
      if (!f.type.startsWith('video/') && !f.type.startsWith('audio/') && !f.type.startsWith('image/')) return;
      if (f.size > 60 * 1024 * 1024) heavy = true;
      next.push({ id: crypto.randomUUID(), name: f.name, type: f.type, url: URL.createObjectURL(f), size: f.size });
    });
    setWarn(heavy ? 'some clips are huge. playback can hitch on this tab. no hard cap.' : '');
    setClips((prev) => [...prev, ...next]);
  };

  const kind = useMemo(() => {
    if (!current) return '';
    if (current.type.startsWith('video/')) return 'video';
    if (current.type.startsWith('audio/')) return 'audio';
    return 'image';
  }, [current]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">reel</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">local media desk.</h1>
          <p className="text-sm text-neutral-500 mb-6">stays on this machine. queue videos, audio, stills. nothing hits the cloud unless you drop it elsewhere.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-8 text-center transition mb-6">
            <input type="file" accept="video/*,audio/*,image/*" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white font-medium">add clips</p>
            <p className="text-xs text-neutral-500 mt-2">video, audio, or stills. local object urls only.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mb-4">{warn}</p>}
          {current && (
            <div className="mb-6">
              {kind === 'video' && <video src={current.url} controls autoPlay className="w-full rounded-2xl bg-black" />}
              {kind === 'audio' && <audio src={current.url} controls autoPlay className="w-full" />}
              {kind === 'image' && <img src={current.url} alt="" className="w-full rounded-2xl" />}
              <p className="text-xs text-neutral-500 mt-3">{current.name}</p>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {clips.map((c, i) => (
              <button
                key={c.id}
                onClick={() => setActive(i)}
                className={`px-3.5 py-1.5 rounded-full text-[13px] ${i === active ? 'bg-white text-black' : 'bg-white/5 text-neutral-300'}`}
              >
                {c.name.slice(0, 18)}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
