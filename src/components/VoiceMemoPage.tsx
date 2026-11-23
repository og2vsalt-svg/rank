import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function VoiceMemoPage() {
  const { navigate } = useRouter();
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warn, setWarn] = useState<string | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioUrl(URL.createObjectURL(blob));
        setWarn(blob.size > 10_000_000 ? 'Long recording may feel slow. No hard limits.' : null);
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      setRecording(true);
      setError(null);
    } catch (e: any) {
      setError(e.message || 'Microphone access denied');
    }
  };

  const stop = () => {
    mediaRef.current?.stop();
    setRecording(false);
  };

  const publish = async () => {
    if (!audioUrl || busy) return;
    setBusy(true);
    try {
      const res = await fetch(audioUrl);
      const blob = await res.blob();
      const file = new File([blob], `memo-${Date.now()}.webm`, { type: 'audio/webm' });
      const result = await publishLocalFile(file, {
        caption: 'Voice memo',
        color: '#34C759',
        cardTitle: 'Voice Memo',
        meta: { desk: 'voicememo' },
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
          <p className="text-[13px] font-medium tracking-wide text-[#34C759] mb-2">Voice Memo</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3 text-white">Record a note. Share it.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Capture a quiet audio memo and publish it as a permanent share with polished Discord embeds. Soft size warnings only.
          </p>

          {!recording && !audioUrl && (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={start}
              className="w-full rounded-2xl py-4 text-[15px] font-medium text-white bg-[#34C759] mb-6"
            >
              Start recording
            </motion.button>
          )}

          {recording && (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={stop}
              className="w-full rounded-2xl py-4 text-[15px] font-medium text-white bg-red-500/80 mb-6"
            >
              Stop
            </motion.button>
          )}

          {audioUrl && (
            <div className="mb-6">
              <audio src={audioUrl} controls className="w-full" />
              <div className="flex gap-3 mt-4">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setAudioUrl(null)}
                  className="flex-1 rounded-2xl py-3 text-sm text-neutral-300 bg-white/5"
                >
                  Discard
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={publish}
                  disabled={busy}
                  className="flex-1 rounded-2xl py-3 text-sm font-medium text-white bg-[#34C759] disabled:opacity-40"
                >
                  {busy ? 'Sharing…' : 'Share'}
                </motion.button>
              </div>
            </div>
          )}

          {warn && <p className="text-[13px] text-amber-300/80 mb-4">{warn}</p>}
          {error && <p className="text-sm text-red-400 mb-4">{error}</p>}
          {link && (
            <button
              onClick={() => navigate('share', link.split('/').pop() || '')}
              className="text-sm text-[#34C759] underline"
            >
              {link}
            </button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
