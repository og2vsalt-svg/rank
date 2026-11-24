import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function WhisperNotesPage() {
  const { navigate } = useRouter();
  const [note, setNote] = useState('');
  const [title, setTitle] = useState('');
  const [color, setColor] = useState('#BF5AF2');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ link?: string; error?: string } | null>(null);

  const publish = async () => {
    if (!note.trim() || busy) return;
    setBusy(true);
    setResult(null);
    try {
      const blob = new Blob([note], { type: 'text/plain' });
      const file = new File([blob], `${title.trim() || 'whisper'}.txt`, { type: 'text/plain' });
      const res = await publishLocalFile(file, {
        caption: note.slice(0, 280),
        color,
        cardTitle: title.trim() || 'Whisper',
        meta: { desk: 'whispernotes', fullNote: note },
      });
      if (res.ok && res.id) {
        setResult({ link: shareUrls(res.id).app });
      } else {
        setResult({ error: res.error || 'Could not whisper the note.' });
      }
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
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 22 }}
          className="glass rounded-[36px] p-8 md:p-12 border border-white/5"
        >
          <p className="text-[13px] font-medium tracking-wide text-[#BF5AF2] mb-2">Whisper Notes</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3 text-white">Quiet thoughts, permanent.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Write a note. Shape a title and soft accent. It becomes a shareable text file with a polished Discord embed. Soft warnings only — notes stay light.
          </p>

          <div className="space-y-4 mb-6">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note title"
              className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/30 transition"
            />
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Whisper something…"
              rows={8}
              className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/30 transition resize-none"
            />
            <div className="flex items-center gap-3">
              <label className="text-sm text-neutral-400">Accent</label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-10 h-10 rounded-full border border-white/10 bg-transparent cursor-pointer"
              />
              <span className="text-xs text-neutral-500">{color}</span>
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.985 }}
            whileHover={{ scale: 1.005 }}
            onClick={publish}
            disabled={busy || !note.trim()}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl bg-[#BF5AF2]"
          >
            {busy ? 'Whispering…' : 'Share the whisper'}
          </motion.button>

          {result?.link && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 glass rounded-2xl p-4">
              <p className="text-sm text-neutral-400 mb-1">Ready</p>
              <button onClick={() => navigate('share', result.link!.split('/').pop() || '')} className="text-[#BF5AF2] text-sm break-all text-left">{result.link}</button>
            </motion.div>
          )}
          {result?.error && <p className="text-sm text-red-400 mt-4">{result.error}</p>}
        </motion.div>
      </div>
    </div>
  );
}
