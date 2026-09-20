import { useRef, useState } from 'react';
import Navbar from './Navbar';

type Shot = { id: string; name: string; url: string; size: number };

export default function GalleryPage() {
  const [shots, setShots] = useState<Shot[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [warn, setWarn] = useState<string | null>(null);

  const onFiles = (files: FileList | null) => {
    if (!files) return;
    const next: Shot[] = [];
    let heavy = false;
    Array.from(files).forEach((f) => {
      if (!f.type.startsWith('image/')) return;
      if (f.size > 25 * 1024 * 1024) heavy = true;
      next.push({ id: crypto.randomUUID(), name: f.name, url: URL.createObjectURL(f), size: f.size });
    });
    setWarn(heavy ? 'some stills are chunky. this tab might feel sleepy.' : null);
    setShots((s) => [...next, ...s]);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-16 px-5 max-w-6xl mx-auto">
        <p className="text-[#0a84ff] text-sm mb-2">gallery desk</p>
        <h1 className="text-3xl font-semibold tracking-tight mb-3">a wall for stills.</h1>
        <p className="text-neutral-400 text-sm mb-6">lives in this tab only. nothing gets posted unless you take it to drop.</p>
        {warn && <p className="text-amber-400 text-xs mb-4">{warn}</p>}
        <button
          onClick={() => inputRef.current?.click()}
          className="rounded-full bg-white text-black text-sm px-5 py-2.5 font-medium hover:scale-[1.02] active:scale-[0.98] transition-transform"
        >
          add stills
        </button>
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-8">
          {shots.map((s) => (
            <figure key={s.id} className="glass rounded-3xl overflow-hidden hover:-translate-y-1 transition-transform duration-300">
              <img src={s.url} alt={s.name} className="w-full h-48 object-cover" />
              <figcaption className="px-3 py-2 text-xs text-neutral-400 truncate">{s.name}</figcaption>
            </figure>
          ))}
        </div>
      </main>
    </div>
  );
}
