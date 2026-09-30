import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function StillPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [src, setSrc] = useState('');
  const [shot, setShot] = useState('');
  const [warn, setWarn] = useState('');

  const onFile = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      setWarn('needs a video file');
      return;
    }
    if (file.size > 80 * 1024 * 1024) setWarn('big clip. decode may feel slow. no cap.');
    else setWarn('');
    setShot('');
    setSrc(URL.createObjectURL(file));
  };

  const grab = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const c = document.createElement('canvas');
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(v, 0, 0);
    setShot(c.toDataURL('image/jpeg', 0.92));
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">still</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">lift a frame from a clip.</h1>
          <p className="text-sm text-neutral-500 mb-6">stays in the tab. good for cover art before you host the file.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-8 text-center transition mb-4">
            <input type="file" accept="video/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            <span className="text-sm text-neutral-300">pick a video</span>
          </label>
          {warn && <p className="text-amber-300/80 text-xs mb-3">{warn}</p>}
          {src && (
            <>
              <video ref={videoRef} src={src} controls className="w-full rounded-2xl mb-4 bg-black" />
              <button onClick={grab} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium mb-4">grab frame</button>
            </>
          )}
          {shot && <img src={shot} alt="still" className="w-full rounded-2xl" />}
        </motion.div>
      </div>
    </div>
  );
}
