import { useState } from 'react';
import { motion } from 'framer-motion';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import Navbar from './Navbar';

export default function QuietGlyphPage() {
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [color, setColor] = useState('#FF9500');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ embed: string; warn?: string | null } | null>(null);
  const [warn, setWarn] = useState<string | null>(null);

  const onFile = (f: File | null) => {
    setFile(f);
    if (f && f.size > 40 * 1024 * 1024) {
      setWarn('large file. the browser may feel slow while uploading. no hard limit.');
    } else {
      setWarn(null);
    }
  };

  const publish = async () => {
    if (!note.trim() && !file) return;
    setBusy(true);
    setResult(null);
    let res;
    if (file) {
      res = await publishLocalFile(file, {
        caption: note || undefined,
        color,
        cardTitle: file.name,
        author: 'rankvault',
        meta: { desk: 'quietglyph', kind: 'glyph' },
      });
    } else {
      const blob = new Blob([note], { type: 'text/plain' });
      const textFile = new File([blob], 'note.txt', { type: 'text/plain' });
      res = await publishLocalFile(textFile, {
        caption: note,
        color,
        cardTitle: note.slice(0, 60) || 'quiet note',
        author: 'rankvault',
        meta: { desk: 'quietglyph', kind: 'note' },
      });
    }
    if (res.ok && res.id) {
      setResult({ embed: shareUrls(res.id).embed, warn: res.warn || null });
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-16 px-5 max-w-2xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 110, damping: 18 }}
          className="text-3xl font-semibold tracking-tight mb-2"
        >
          quiet glyph
        </motion.h1>
        <p className="text-neutral-400 text-sm mb-8">
          Compose a quiet note or drop a single local file. It settles into storage and the public record with a polished Discord embed. Soft size warnings only. No hard limits. Spring-animated frosted glass.
        </p>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="write a quiet line…"
          className="w-full glass rounded-2xl px-4 py-3 text-sm min-h-[120px] outline-none mb-4 resize-y"
        />

        <input
          type="file"
          onChange={(e) => onFile(e.target.files?.[0] || null)}
          className="block w-full text-sm text-neutral-400 file:mr-3 file:rounded-full file:border-0 file:bg-white/10 file:px-4 file:py-1.5 file:text-sm file:text-white mb-4"
        />
        {file && <p className="text-xs text-neutral-500 mb-2">{file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB</p>}
        {warn && <p className="text-amber-400 text-xs mb-4">{warn}</p>}

        <div className="flex items-center gap-3 mb-6">
          <span className="text-xs text-neutral-400">accent</span>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-10 rounded-full" />
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={publish}
          disabled={busy || (!note.trim() && !file)}
          className="w-full py-3 rounded-full bg-[#FF9500] text-black font-medium disabled:opacity-50"
        >
          {busy ? 'settling…' : 'publish to database'}
        </motion.button>

        {result && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-4 mt-6">
            <p className="text-xs text-neutral-400 break-all">{result.embed}</p>
            {result.warn && <p className="text-amber-400 text-xs mt-1">{result.warn}</p>}
            <button onClick={() => navigator.clipboard.writeText(result.embed)} className="text-xs text-[#FF9500] mt-2">copy discord link</button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
