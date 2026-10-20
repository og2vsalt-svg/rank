import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function QuietNotesPage() {
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [color, setColor] = useState('#64D2FF');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [warn, setWarn] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    if (f && f.size > 40 * 1024 * 1024) {
      setWarn('large attachment. the browser may feel slow while it sends. no hard limit.');
    } else setWarn(null);
    setFile(f);
  };

  const share = async () => {
    if (!note.trim() && !file) return;
    setUploading(true);
    let res;
    if (file) {
      res = await publishLocalFile(file, { caption: note, color, meta: { desk: 'quietnotes' } });
    } else {
      // notes-only: publish a tiny placeholder or use publishShare if available, but for simplicity use a dummy text file
      const blob = new Blob([note], { type: 'text/plain' });
      const dummy = new File([blob], 'note.txt', { type: 'text/plain' });
      res = await publishLocalFile(dummy, { caption: note, color, meta: { desk: 'quietnotes', notesOnly: true } });
    }
    if (res.ok) setResult(res);
    setUploading(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="max-w-2xl mx-auto px-5 pt-28 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="glass rounded-[28px] p-8 mb-6"
        >
          <p className="text-xs uppercase tracking-[0.18em] text-[#64D2FF] mb-2">quietnotes</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">quiet notes, optionally with a file</h1>
          <p className="text-sm text-neutral-400 leading-relaxed">
            Write a note first. Attach a file only if you wish. Lands in the database with a polished Discord embed. Different from a plain file vault — notes are the heart. Spring motion, glass. Large files warned, never refused. Prior features preserved.
          </p>
        </motion.div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="write a quiet note…"
          className="glass w-full rounded-2xl px-4 py-4 text-sm outline-none min-h-[120px] mb-4"
        />

        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => inputRef.current?.click()}
            className="glass rounded-2xl px-4 py-2.5 text-sm"
          >
            {file ? file.name.slice(0, 24) + (file.name.length > 24 ? '…' : '') : 'optional file'}
          </button>
          <input ref={inputRef} type="file" className="hidden" onChange={onSelect} />
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-12 h-10 rounded-xl cursor-pointer bg-transparent"
          />
        </div>

        {warn && <p className="text-xs text-amber-400/80 mb-4">{warn}</p>}

        <button
          onClick={share}
          disabled={(!note.trim() && !file) || uploading}
          className="w-full glass rounded-2xl py-3.5 text-sm font-medium disabled:opacity-40 hover:bg-white/10 transition"
        >
          {uploading ? 'sending the note…' : 'share the note'}
        </button>

        {result && (
          <motion.a
            href={shareUrls(result.id).app}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-4 block mt-6 hover:bg-white/[0.06] transition"
          >
            <p className="text-sm font-medium">note shared</p>
            <p className="text-xs text-neutral-500 mt-1 truncate">{result.embed}</p>
          </motion.a>
        )}
      </main>
    </div>
  );
}
