import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function RecordPage() {
  const [rec, setRec] = useState<MediaRecorder | null>(null);
  const [chunks, setChunks] = useState<Blob[]>([]);
  const [url, setUrl] = useState('');
  const [err, setErr] = useState('');
  const [live, setLive] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const start = async () => {
    setErr('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream);
      const local: Blob[] = [];
      mr.ondataavailable = (e) => {
        if (e.data.size) local.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(local, { type: mr.mimeType || 'audio/webm' });
        setChunks(local);
        setUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      setRec(mr);
      setLive(true);
    } catch {
      setErr('mic blocked or missing. allow access and try again.');
    }
  };

  const stop = () => {
    rec?.stop();
    setLive(false);
    setRec(null);
  };

  const download = () => {
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `rank-memo-${Date.now()}.webm`;
    a.click();
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">record</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">leave a quiet memo.</h1>
          <p className="text-neutral-400 text-sm mb-6">records in the tab. nothing leaves this device unless you download it into the vault yourself.</p>
          {err && <p className="text-sm text-red-400 mb-4">{err}</p>}
          <div className="flex flex-wrap gap-2 mb-6">
            {!live ? (
              <button onClick={start} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">start</button>
            ) : (
              <button onClick={stop} className="px-5 py-2.5 rounded-full bg-red-500 text-white text-sm font-medium">stop</button>
            )}
            {url && <button onClick={download} className="px-5 py-2.5 rounded-full bg-white/5 text-sm">download webm</button>}
          </div>
          {live && <p className="text-xs text-neutral-500 mb-4">listening… tap stop when you are done.</p>}
          {url && <audio src={url} controls className="w-full" />}
          {chunks.length > 0 && <p className="text-xs text-neutral-600 mt-3">{chunks.length} chunk{chunks.length === 1 ? '' : 's'} captured</p>}
        </motion.div>
      </div>
    </div>
  );
}
