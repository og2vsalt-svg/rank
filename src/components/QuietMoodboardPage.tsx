import { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

type BoardItem = {
  id: string;
  file?: File;
  preview?: string;
  note?: string;
  x: number;
  y: number;
  status: 'queued' | 'uploading' | 'done' | 'error';
  link?: string;
};

export default function QuietMoodboardPage() {
  const [items, setItems] = useState<BoardItem[]>([]);
  const [accent, setAccent] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  const addFiles = useCallback((list: FileList | File[]) => {
    const arr = Array.from(list);
    const total = arr.reduce((s, f) => s + f.size, 0);
    setWarn(total > 45_000_000 ? 'Large board — uploads may feel slower. No hard limits.' : null);
    const next: BoardItem[] = arr.map((file, i) => ({
      id: Math.random().toString(36).slice(2, 10),
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      note: '',
      x: 40 + (i % 4) * 180,
      y: 40 + Math.floor(i / 4) * 160,
      status: 'queued',
    }));
    setItems((p) => [...p, ...next]);
  }, []);

  const addNote = () => {
    setItems((p) => [...p, {
      id: Math.random().toString(36).slice(2, 10),
      note: 'quiet note',
      x: 80 + Math.random() * 200,
      y: 80 + Math.random() * 150,
      status: 'queued',
    }]);
  };

  const updateNote = (id: string, note: string) => {
    setItems((p) => p.map((i) => i.id === id ? { ...i, note } : i));
  };

  const move = (id: string, dx: number, dy: number) => {
    setItems((p) => p.map((i) => i.id === id ? { ...i, x: Math.max(0, i.x + dx), y: Math.max(0, i.y + dy) } : i));
  };

  const publishAll = async () => {
    if (!items.length || busy) return;
    setBusy(true);
    for (const item of items) {
      if (item.status === 'done' || !item.file) continue;
      setItems((p) => p.map((i) => i.id === item.id ? { ...i, status: 'uploading' } : i));
      try {
        const res = await publishLocalFile(item.file, {
          caption: item.note || item.file.name,
          color: accent,
          cardTitle: 'Quiet Moodboard',
          meta: { desk: 'quietmoodboard' },
        });
        setItems((p) => p.map((i) =>
          i.id === item.id
            ? { ...i, status: res.ok ? 'done' : 'error', link: res.embed }
            : i
        ));
      } catch {
        setItems((p) => p.map((i) => i.id === item.id ? { ...i, status: 'error' } : i));
      }
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 110, damping: 22 }}
          className="glass rounded-[36px] p-6 md:p-8 mb-6"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
            <div>
              <p className="text-[13px] font-medium tracking-wide mb-1" style={{ color: accent }}>Quiet Moodboard</p>
              <h1 className="text-3xl font-semibold tracking-tight">Arrange a quiet board.</h1>
            </div>
            <div className="flex items-center gap-3">
              <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-8 rounded-lg border border-white/10 bg-transparent cursor-pointer" />
              <button onClick={addNote} className="px-4 py-2 rounded-full bg-white/10 text-sm hover:bg-white/15">+ note</button>
              <button onClick={publishAll} disabled={!items.some(i => i.file) || busy} className="px-5 py-2 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40" style={{ background: accent }}>
                {busy ? 'settling…' : 'publish files'}
              </button>
            </div>
          </div>
          <p className="text-neutral-400 text-sm">
            Drop images or notes onto the board. Drag to arrange. Files settle into the database with polished Discord embeds. Soft warnings only. No hard limits.
          </p>
        </motion.div>

        {warn && <p className="text-amber-300/80 text-sm mb-4 text-center">{warn}</p>}

        <div
          ref={boardRef}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
          }}
          className="relative glass rounded-3xl min-h-[520px] overflow-hidden border border-white/10"
          style={{ background: 'radial-gradient(800px 400px at 20% 10%, rgba(10,132,255,0.08), transparent)' }}
        >
          {items.map((item) => (
            <motion.div
              key={item.id}
              drag
              dragMomentum={false}
              onDragEnd={(_, info) => move(item.id, info.offset.x, info.offset.y)}
              style={{ x: item.x, y: item.y, position: 'absolute' }}
              className="w-40 glass rounded-2xl p-2 cursor-grab active:cursor-grabbing shadow-lg"
            >
              {item.preview && <img src={item.preview} alt="" className="w-full aspect-square object-cover rounded-xl mb-2" />}
              <input
                value={item.note || ''}
                onChange={(e) => updateNote(item.id, e.target.value)}
                placeholder="note"
                className="w-full text-xs bg-transparent border-none outline-none"
              />
              {item.status === 'done' && item.link && (
                <a href={item.link} target="_blank" rel="noreferrer" className="text-[10px] text-[#0a84ff] truncate block mt-1">link</a>
              )}
            </motion.div>
          ))}
          {items.length === 0 && (
            <div className="absolute inset-0 grid place-items-center text-neutral-500 text-sm">
              drop images or click + note
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
