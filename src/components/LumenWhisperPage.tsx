import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';
import Navbar from './Navbar';

export default function LumenWhisperPage() {
  const { navigate } = useRouter();
  const [note, setNote] = useState('');
  const [title, setTitle] = useState('a quiet whisper');
  const [accent, setAccent] = useState('#64D2FF');
  const [file, setFile] = useState<File | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState<{ id: string; url: string; warn?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const publish = async () => {
    if (!note.trim() && !file) {
      setError('write a note or attach a file');
      return;
    }
    setPublishing(true);
    setError(null);
    try {
      if (file) {
        const pub = await publishLocalFile(file, {
          caption: note || title,
          cardTitle: title,
          color: accent,
          meta: { desk: 'lumenwhisper', note },
        });
        if (pub.ok && pub.id) {
          setResult({ id: pub.id, url: shareUrls(pub.id).embed, warn: pub.warn || undefined });
        } else {
          setError(pub.error || 'could not publish');
        }
      } else {
        // pure note — create a small text file
        const blob = new Blob([note], { type: 'text/plain' });
        const textFile = new File([blob], `${title || 'whisper'}.txt`, { type: 'text/plain' });
        const pub = await publishLocalFile(textFile, {
          caption: note,
          cardTitle: title,
          color: accent,
          meta: { desk: 'lumenwhisper', pureNote: true },
        });
        if (pub.ok && pub.id) {
          setResult({ id: pub.id, url: shareUrls(pub.id).embed, warn: pub.warn || undefined });
        } else {
          setError(pub.error || 'could not publish note');
        }
      }
    } catch (e: any) {
      setError(e?.message || 'publish failed');
    }
    setPublishing(false);
  };

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7] font-sans antialiased">
      <Navbar />
      <div className="max-w-2xl mx-auto px-6 pt-28 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
          className="text-center mb-12"
        >
          <p className="text-[#64D2FF] text-sm tracking-wide mb-3">lumen whisper</p>
          <h1 className="text-5xl font-semibold tracking-tight mb-5 leading-[1.02]">leave a quiet mark.</h1>
          <p className="text-neutral-400 text-lg leading-relaxed">
            Write a note, optionally attach a local file, choose an accent, and publish a permanent Discord-ready share. Soft size warnings only. Apple-style springs on frosted glass.
          </p>
        </motion.div>

        <div className="space-y-5 glass rounded-3xl p-8">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="title" className="w-full bg-transparent border-b border-white/10 py-2 text-lg outline-none focus:border-[#64D2FF]/50" />
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="your whisper…" rows={5} className="w-full bg-white/[0.03] rounded-2xl p-4 text-sm outline-none resize-none focus:ring-1 focus:ring-[#64D2FF]/40" />
          <div className="flex items-center gap-4">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-12 h-12 rounded-xl cursor-pointer" />
            <button onClick={() => fileRef.current?.click()} className="px-5 py-2.5 rounded-full bg-white/10 text-sm hover:bg-white/15 transition">
              {file ? file.name : 'attach local file (optional)'}
            </button>
            <input ref={fileRef} type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={publish}
            disabled={publishing}
            className="w-full py-3.5 rounded-full text-sm font-medium text-black disabled:opacity-50"
            style={{ background: accent }}
          >
            {publishing ? 'publishing…' : 'publish whisper'}
          </motion.button>
          {error && <p className="text-sm text-red-400 text-center">{error}</p>}
          {result && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-3 pt-2">
              <p className="text-sm text-neutral-400">permanent Discord-ready link</p>
              {result.warn && <p className="text-xs text-amber-400">{result.warn}</p>}
              <button onClick={() => navigator.clipboard.writeText(result.url)} className="px-6 py-2.5 rounded-full bg-white/10 text-sm hover:bg-white/15">
                copy share link
              </button>
            </motion.div>
          )}
        </div>

        <button onClick={() => navigate('home')} className="block mx-auto mt-10 text-sm text-neutral-500 hover:text-white">← back home</button>
      </div>
    </div>
  );
}
