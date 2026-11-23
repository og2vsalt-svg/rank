import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function CapturePage() {
  const { navigate } = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warn, setWarn] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [stream]);

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
      setError(null);
    } catch (e: any) {
      setError(e.message || 'Camera access denied');
    }
  };

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current;
    const c = canvasRef.current;
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    const ctx = c.getContext('2d');
    if (ctx) {
      ctx.drawImage(v, 0, 0);
      const data = c.toDataURL('image/jpeg', 0.92);
      setPhoto(data);
      setWarn(data.length > 5_000_000 ? 'Large photo may feel slow to upload. No hard limits.' : null);
    }
  };

  const publish = async () => {
    if (!photo || busy) return;
    setBusy(true);
    try {
      const res = await fetch(photo);
      const blob = await res.blob();
      const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const result = await publishLocalFile(file, {
        caption: 'Captured photo',
        color: '#0A84FF',
        cardTitle: 'Capture',
        meta: { desk: 'capture' },
      });
      if (result.ok && result.id) {
        setLink(shareUrls(result.id).app);
      } else {
        setError(result.error || 'Upload failed');
      }
    } catch (e: any) {
      setError(e.message);
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 80, damping: 20 }}
          className="glass rounded-[36px] p-8 md:p-12 border border-white/5"
        >
          <p className="text-[13px] font-medium tracking-wide text-[#0A84FF] mb-2">Capture</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3 text-white">Take a photo. Share it.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Use your camera to capture a moment and publish it as a permanent share with polished Discord embeds. Soft size warnings only.
          </p>

          {!stream && (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={startCamera}
              className="w-full rounded-2xl py-4 text-[15px] font-medium text-white bg-[#0A84FF] mb-6"
            >
              Start camera
            </motion.button>
          )}

          {stream && !photo && (
            <div className="mb-6">
              <video ref={videoRef} autoPlay playsInline className="w-full rounded-3xl bg-black" />
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={takePhoto}
                className="w-full mt-4 rounded-2xl py-4 text-[15px] font-medium text-white bg-white/10"
              >
                Capture
              </motion.button>
            </div>
          )}

          {photo && (
            <div className="mb-6">
              <img src={photo} alt="capture" className="w-full rounded-3xl" />
              <div className="flex gap-3 mt-4">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setPhoto(null)}
                  className="flex-1 rounded-2xl py-3 text-sm text-neutral-300 bg-white/5"
                >
                  Retake
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={publish}
                  disabled={busy}
                  className="flex-1 rounded-2xl py-3 text-sm font-medium text-white bg-[#0A84FF] disabled:opacity-40"
                >
                  {busy ? 'Sharing…' : 'Share'}
                </motion.button>
              </div>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />

          {warn && <p className="text-[13px] text-amber-300/80 mb-4">{warn}</p>}
          {error && <p className="text-sm text-red-400 mb-4">{error}</p>}
          {link && (
            <button
              onClick={() => navigate('share', link.split('/').pop() || '')}
              className="text-sm text-[#0A84FF] underline"
            >
              {link}
            </button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
