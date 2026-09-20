import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function download(blob: Blob, name: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

export default function SplitPage() {
  const [file, setFile] = useState<File | null>(null);
  const [chunkKb, setChunkKb] = useState(512);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  async function run() {
    if (!file) return;
    const size = Math.max(32, chunkKb) * 1024;
    setBusy(true);
    setNote(file.size > 40 * 1024 * 1024 ? 'large file — slicing might feel sleepy. still no hard cap.' : 'slicing…');
    let i = 0;
    let offset = 0;
    while (offset < file.size) {
      const piece = file.slice(offset, offset + size);
      download(piece, `${file.name}.part${String(i).padStart(3, '0')}`);
      offset += size;
      i += 1;
      await new Promise((r) => setTimeout(r, 40));
    }
    setNote(`cut into ${i} parts. stitch them later with any binary concat.`);
    setBusy(false);
  }

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20 px-5">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-3">split</p>
          <h1 className="text-3xl font-semibold text-white tracking-tight">file splitter</h1>
          <p className="text-sm text-neutral-500 mt-2 mb-8">carve a local file into chunks. lives only in this tab.</p>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => inputRef.current?.click()}
            className="w-full glass rounded-3xl py-14 text-center hover:bg-white/[0.04] transition-colors"
          >
            <p className="text-white text-sm">{file ? file.name : 'choose a file'}</p>
            <p className="text-xs text-neutral-500 mt-2">{file ? `${Math.round(file.size / 1024)} kb` : 'no upload. just slices in memory.'}</p>
          </motion.button>
          <input ref={inputRef} type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />

          <label className="block mt-6 text-xs text-neutral-500 mb-2">chunk size (kb)</label>
          <input
            type="number"
            min={32}
            value={chunkKb}
            onChange={(e) => setChunkKb(Number(e.target.value) || 512)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-[#0a84ff]/60"
          />

          <motion.button
            whileTap={{ scale: 0.98 }}
            disabled={!file || busy}
            onClick={run}
            className="mt-5 w-full rounded-full bg-white text-black text-sm font-medium py-3 disabled:opacity-40"
          >
            {busy ? 'slicing…' : 'split'}
          </motion.button>
          {note && <p className="text-xs text-neutral-500 mt-3">{note}</p>}
        </div>
      </main>
    </div>
  );
}
