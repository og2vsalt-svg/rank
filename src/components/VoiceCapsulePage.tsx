import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function VoiceCapsulePage() {
  const { navigate } = useRouter();
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState<{ url: string; warn?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorder.current = recorder;
      chunks.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunks.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };
      recorder.start();
      setRecording(true);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'microphone access needed');
    }
  }, []);

  const stopRecording = useCallback(() => {
    mediaRecorder.current?.stop();
    setRecording(false);
  }, []);

  const publish = async () => {
    if (!audioBlob && !caption.trim()) {
      setError('record a voice or write a note');
      return;
    }
    setPublishing(true);
    setError(null);
    setResult(null);
    try {
      if (audioBlob) {
        const file = new File([audioBlob], `${title || 'voice'}.webm`, { type: 'audio/webm' });
        const pub = await publishLocalFile(file, {
          caption: caption.trim() || 'A quiet voice capsule',
          cardTitle: title.trim() || 'Voice Capsule',
          color: accent,
          meta: { voice: true },
        });
        if (pub.ok && pub.id) {
          const urls = shareUrls(pub.id);
          setResult({ url: urls.embed, warn: pub.warn || undefined });
        } else {
          setError(pub.error || 'could not publish');
        }
      } else {
        setError('please record audio first');
      }
    } catch (e: any) {
      setError(e?.message || 'something quiet went wrong');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7] font-sans antialiased">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="text-center mb-12"
        >
          <p className="text-[#0A84FF] text-sm tracking-wide mb-3">voice capsule</p>
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight mb-4 leading-[1.02]">a quiet voice.<br />seal and share.</h1>
          <p className="text-neutral-400 text-lg max-w-xl mx-auto leading-relaxed">Record a voice note. Add a title and caption. Choose an accent. Publish a permanent Discord-ready link. Soft size warnings only — no hard limits, no boosting. Apple-style springs on frosted glass.</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 120, damping: 22, delay: 0.05 }}
            className="space-y-5"
          >
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="title"
              className="w-full px-5 py-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-base outline-none focus:border-[#0A84FF]/50 transition"
            />
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="optional caption…"
              rows={4}
              className="w-full px-5 py-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-sm outline-none focus:border-[#0A84FF]/50 transition resize-none"
            />
            <div className="flex items-center gap-3">
              <label className="text-xs text-neutral-500">accent</label>
              <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full border border-white/10 cursor-pointer bg-transparent" />
              <span className="text-xs text-neutral-400">{accent}</span>
            </div>

            <div className="flex gap-3">
              {!recording ? (
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={startRecording}
                  className="flex-1 py-3.5 rounded-full bg-white/10 border border-white/10 text-sm font-medium"
                >
                  start recording
                </motion.button>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={stopRecording}
                  className="flex-1 py-3.5 rounded-full bg-red-500/20 border border-red-500/40 text-sm font-medium text-red-300"
                >
                  stop recording
                </motion.button>
              )}
            </div>

            {audioUrl && (
              <audio controls src={audioUrl} className="w-full mt-2" />
            )}

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={publish}
              disabled={publishing || !audioBlob}
              className="w-full py-3.5 rounded-full bg-[#0A84FF] text-white text-sm font-medium disabled:opacity-50"
            >
              {publishing ? 'publishing…' : 'publish capsule'}
            </motion.button>
            {error && <p className="text-sm text-red-400 text-center">{error}</p>}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 120, damping: 22, delay: 0.1 }}
            className="glass rounded-3xl p-6 sticky top-24"
          >
            <p className="text-xs text-neutral-500 mb-4">live preview</p>
            <div className="rounded-2xl overflow-hidden border border-white/5" style={{ borderTop: `3px solid ${accent}` }}>
              <div className="p-5">
                <h3 className="font-medium text-lg mb-2">{title || 'untitled voice'}</h3>
                <p className="text-sm text-neutral-400 whitespace-pre-wrap leading-relaxed">{caption || 'your caption will appear here.'}</p>
                {audioUrl && <p className="text-xs text-neutral-500 mt-3">audio recorded · ready to share</p>}
              </div>
            </div>
            <p className="text-xs text-neutral-500 mt-4">the published link carries a polished Discord embed.</p>
          </motion.div>
        </div>

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-12 text-center space-y-4"
            >
              <p className="text-sm text-neutral-400">capsule is live</p>
              <button
                onClick={() => navigator.clipboard.writeText(result.url)}
                className="px-6 py-3 rounded-full bg-white text-black text-sm font-medium"
              >
                copy share link
              </button>
              {result.warn && <p className="text-xs text-amber-400">{result.warn}</p>}
              <button onClick={() => navigate('home')} className="block mx-auto text-sm text-neutral-500 hover:text-white">← back home</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
