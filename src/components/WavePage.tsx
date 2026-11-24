import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function WavePage() {
  const { navigate } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ link?: string; error?: string; warn?: string } | null>(null);
  const [warn, setWarn] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animRef = useRef<number>(0);

  const setupAudio = useCallback(async (blobUrl: string) => {
    if (!audioRef.current || !canvasRef.current) return;
    const audio = audioRef.current;
    audio.src = blobUrl;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = ctx.createMediaElementSource(audio);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyser.connect(ctx.destination);
      analyserRef.current = analyser;

      const canvas = canvasRef.current;
      const c = canvas.getContext('2d');
      if (!c) return;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        animRef.current = requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);
        c.clearRect(0, 0, canvas.width, canvas.height);
        const barWidth = (canvas.width / bufferLength) * 2.2;
        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * canvas.height * 0.85;
          const gradient = c.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
          gradient.addColorStop(0, '#0A84FF');
          gradient.addColorStop(1, '#5AC8FA');
          c.fillStyle = gradient;
          c.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
          x += barWidth;
        }
      };
      draw();
    } catch {
      // silent if audio context fails
    }
  }, []);

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const onFile = (f: File | null) => {
    if (!f) return;
    if (!f.type.startsWith('audio/')) {
      setWarn('Please drop an audio file');
      return;
    }
    setWarn(f.size > 40 * 1024 * 1024 ? 'Large audio may feel slow to process. No hard limits.' : null);
    setFile(f);
    const url = URL.createObjectURL(f);
    setAudioUrl(url);
    setResult(null);
    setTimeout(() => setupAudio(url), 50);
  };

  const publish = async () => {
    if (!file || busy) return;
    setBusy(true);
    try {
      const res = await publishLocalFile(file, {
        caption: caption.trim() || file.name,
        color: '#0A84FF',
        cardTitle: file.name,
        meta: { desk: 'wave' },
      });
      const link = res.ok && res.id ? shareUrls(res.id).app : undefined;
      setResult({ link, error: res.error, warn: res.warn || undefined });
    } catch (e: any) {
      setResult({ error: e.message });
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 22 }}
          className="glass rounded-[36px] p-8 md:p-12 border border-white/5"
        >
          <p className="text-[13px] font-medium tracking-wide text-[#0A84FF] mb-2">Wave</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3 text-white">See the sound.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Drop an audio file, watch the living spectrum, add a quiet caption, and share a permanent link with polished Discord embeds. Soft size warnings only.
          </p>

          <div
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-[#0A84FF]/40'); }}
            onDragLeave={(e) => e.currentTarget.classList.remove('ring-2', 'ring-[#0A84FF]/40')}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('ring-2', 'ring-[#0A84FF]/40');
              onFile(e.dataTransfer.files[0] || null);
            }}
            onClick={() => document.getElementById('wave-input')?.click()}
            className="border-2 border-dashed border-white/15 rounded-3xl p-12 text-center mb-6 cursor-pointer hover:border-white/30 transition bg-black/20"
          >
            <p className="text-neutral-300 text-[15px]">Drop audio here</p>
            <p className="text-neutral-500 text-sm mt-1">or click to browse</p>
            <input id="wave-input" type="file" accept="audio/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0] || null)} />
          </div>

          {audioUrl && (
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="mb-6">
              <canvas ref={canvasRef} width={640} height={140} className="w-full rounded-2xl bg-black/40 border border-white/5" />
              <audio ref={audioRef} controls className="w-full mt-4 rounded-xl" />
            </motion.div>
          )}

          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Quiet caption"
            rows={2}
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-5 focus:outline-none focus:border-white/30 transition resize-none"
          />

          {warn && <p className="text-[13px] text-amber-300/80 mb-4">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.985 }}
            whileHover={{ scale: 1.005 }}
            onClick={publish}
            disabled={busy || !file}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl bg-[#0A84FF]"
          >
            {busy ? 'Sharing…' : 'Share wave'}
          </motion.button>

          <AnimatePresence>
            {result?.link && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 text-center">
                <button onClick={() => navigate('share', result.link!.split('/').pop() || '')} className="text-[#0A84FF] text-sm">{result.link}</button>
              </motion.div>
            )}
            {result?.error && <p className="text-red-400 text-sm mt-3 text-center">{result.error}</p>}
            {result?.warn && <p className="text-amber-300/80 text-sm mt-2 text-center">{result.warn}</p>}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
