import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function WeavePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [warn, setWarn] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function add(list: FileList | null) {
    if (!list) return;
    const next = [...files, ...Array.from(list)];
    setFiles(next);
    const total = next.reduce((n, f) => n + f.size, 0);
    setWarn(total > 80 * 1024 * 1024 ? 'chunky pile — stitching might make this tab sleepy. no hard cap.' : '');
  }

  async function stitch() {
    if (!files.length) return;
    const parts: BlobPart[] = [];
    for (const f of files) {
      parts.push(`\n----- ${f.name} -----\n`);
      parts.push(await f.arrayBuffer());
    }
    const blob = new Blob(parts, { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'weave.bin';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20 px-5">
        <div className="max-w-xl mx-auto">
          <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-3">weave</p>
          <h1 className="text-3xl font-semibold text-white tracking-tight">stitch files</h1>
          <p className="text-sm text-neutral-500 mt-2 mb-8">glue local files into one download. stays on this device.</p>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => inputRef.current?.click()}
            className="w-full glass rounded-3xl py-14 text-center"
          >
            <p className="text-white text-sm">add files</p>
            <p className="text-xs text-neutral-500 mt-2">{files.length ? `${files.length} staged` : 'no vault dump, just a stitcher'}</p>
          </motion.button>
          <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => add(e.target.files)} />

          {warn && <p className="text-xs text-amber-400/80 mt-3">{warn}</p>}

          {files.length > 0 && (
            <ul className="mt-5 space-y-2">
              {files.map((f, i) => (
                <li key={i} className="glass rounded-2xl px-4 py-3 text-sm text-neutral-300 flex justify-between gap-3">
                  <span className="truncate">{f.name}</span>
                  <span className="text-neutral-500 text-xs shrink-0">{Math.round(f.size / 1024)} kb</span>
                </li>
              ))}
            </ul>
          )}

          {files.length > 0 && (
            <motion.button whileTap={{ scale: 0.98 }} onClick={stitch} className="mt-6 w-full rounded-full bg-white text-black text-sm font-medium py-2.5">
              download weave
            </motion.button>
          )}
        </div>
      </main>
    </div>
  );
}
