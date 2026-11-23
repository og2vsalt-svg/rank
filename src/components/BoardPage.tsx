import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

type Pin = {
  id: string;
  type: 'note' | 'file';
  content: string;
  file?: File;
  preview?: string;
  x: number;
  y: number;
};

export default function BoardPage() {
  const { navigate } = useRouter();
  const [pins, setPins] = useState<Pin[]>([]);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [warn, setWarn] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  const addNote = () => {
    if (!note.trim()) return;
    setPins((p) => [
      ...p,
      {
        id: Math.random().toString(36).slice(2, 10),
        type: 'note',
        content: note.trim(),
        x: 40 + Math.random() * 60,
        y: 30 + Math.random() * 50,
      },
    ]);
    setNote('');
  };

  const addFiles = useCallback((list: FileList | File[]) => {
    const arr = Array.from(list);
    const total = arr.reduce((s, f) => s + f.size, 0) + pins.reduce((s, p) => s + (p.file?.size || 0), 0);
    setWarn(total > 60_000_000 ? 'Large board. Encoding may feel slow. No hard limits.' : null);
    const next: Pin[] = arr.map((file) => ({
      id: Math.random().toString(36).slice(2, 10),
      type: 'file',
      content: file.name,
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      x: 20 + Math.random() * 70,
      y: 20 + Math.random() * 60,
    }));
    setPins((p) => [...p, ...next]);
  }, [pins]);

  const publish = async () => {
    if (!pins.length || busy) return;
    setBusy(true);
    setLink(null);
    try {
      const summary = pins.map((p) => (p.type === 'note' ? `• ${p.content}` : `• file: ${p.content}`)).join('\n');
      const blob = new Blob([summary || 'empty board'], { type: 'text/plain' });
      const file = new File([blob], 'board.txt', { type: 'text/plain' });
      const res = await publishLocalFile(file, {
        caption: 'Quiet board from rankvault',
        color: '#0A84FF',
        cardTitle: 'Board',
        meta: { desk: 'board', pinCount: pins.length },
      });
      if (res.ok && res.id) {
        setLink(shareUrls(res.id).app);
      }
    } catch (e) {
      console.error(e);
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 22 }}
          className="glass rounded-[36px] p-6 md:p-10 border border-white/5"
        >
          <p className="text-[13px] font-medium tracking-wide text-[#0A84FF] mb-2">Board</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3 text-white">Pin anything.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-6">
            A quiet pinboard for notes and local files. Arrange them freely, then publish the board as one polished share. Soft size warnings only.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addNote()}
              placeholder="Write a note and press enter"
              className="flex-1 bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/30"
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="px-5 py-3 rounded-2xl bg-white/10 text-white text-sm hover:bg-white/15 transition"
            >
              add files
            </button>
            <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => e.target.files && addFiles(e.target.files)} />
          </div>

          {warn && <p className="text-[13px] text-amber-300/80 mb-4">{warn}</p>}

          <div
            ref={boardRef}
            className="relative min-h-[420px] rounded-3xl border border-white/10 bg-black/20 overflow-hidden mb-6"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
            }}
          >
            <AnimatePresence>
              {pins.map((pin) => (
                <motion.div
                  key={pin.id}
                  drag
                  dragMomentum={false}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                  className="absolute glass rounded-2xl p-4 max-w-[220px] cursor-grab active:cursor-grabbing border border-white/5 shadow-lg"
                  whileHover={{ scale: 1.02 }}
                >
                  {pin.preview ? (
                    <img src={pin.preview} alt="" className="w-full h-24 object-cover rounded-xl mb-2" />
                  ) : null}
                  <p className="text-sm text-white leading-snug">{pin.content}</p>
                  <button
                    onClick={() => setPins((p) => p.filter((x) => x.id !== pin.id))}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white/10 text-xs grid place-items-center hover:bg-white/20"
                  >
                    ×
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            {!pins.length && (
              <p className="absolute inset-0 grid place-items-center text-neutral-500 text-sm">Drop files or add notes to start your board</p>
            )}
          </div>

          <motion.button
            whileTap={{ scale: 0.985 }}
            onClick={publish}
            disabled={busy || !pins.length}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl bg-[#0A84FF]"
          >
            {busy ? 'Publishing board…' : pins.length ? 'Publish board' : 'Add something first'}
          </motion.button>

          {link && (
            <button
              onClick={() => navigate('share', link.split('/').pop() || '')}
              className="mt-4 text-sm text-[#0A84FF] hover:underline block"
            >
              {link}
            </button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
