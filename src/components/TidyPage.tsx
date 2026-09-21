import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

type Row = { name: string; size: number; type: string; key: string };

function hashNameSize(f: File) {
  return `${f.size}:${f.name.toLowerCase()}`;
}

export default function TidyPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [warn, setWarn] = useState<string | null>(null);

  const onPick = (list: FileList | null) => {
    if (!list || !list.length) return;
    const files = Array.from(list);
    const total = files.reduce((s, f) => s + f.size, 0);
    setWarn(total > 80 * 1024 * 1024 ? 'big batch. the tab might feel sleepy while it groups them.' : null);
    const map = new Map<string, Row[]>();
    for (const f of files) {
      const key = hashNameSize(f);
      const row = { name: f.name, size: f.size, type: f.type || 'file', key };
      const bucket = map.get(key) || [];
      bucket.push(row);
      map.set(key, bucket);
    }
    const dups = Array.from(map.values())
      .filter((b) => b.length > 1)
      .flat();
    setRows(dups.length ? dups : files.map((f) => ({ name: f.name, size: f.size, type: f.type || 'file', key: hashNameSize(f) })));
  };

  const grouped = rows.reduce<Record<string, Row[]>>((acc, r) => {
    (acc[r.key] ||= []).push(r);
    return acc;
  }, {});

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20 px-5">
        <div className="max-w-xl mx-auto">
          <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-3">tidy</p>
          <h1 className="text-3xl font-semibold tracking-tight">spot local twins</h1>
          <p className="text-sm text-neutral-500 mt-2 mb-8">not the vault. drop a pile of files and we group same name + size. nothing leaves the tab.</p>
          <label className="block glass rounded-3xl p-10 text-center cursor-pointer">
            <input type="file" multiple className="hidden" onChange={(e) => onPick(e.target.files)} />
            <p className="text-white font-medium">pick a messy folder</p>
            <p className="text-xs text-neutral-500 mt-2">no cap. just a slowness note if it is huge.</p>
          </label>
          {warn && <p className="text-amber-400 text-xs mt-4">{warn}</p>}
          <div className="mt-6 space-y-3">
            {Object.entries(grouped).map(([key, items]) => (
              <motion.div key={key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-5">
                <p className="text-xs text-neutral-500 mb-2">{items.length > 1 ? `${items.length} copies` : 'unique'}</p>
                {items.map((it, i) => (
                  <p key={i} className="text-sm text-white truncate">{it.name} · {(it.size / 1024).toFixed(1)} kb</p>
                ))}
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
