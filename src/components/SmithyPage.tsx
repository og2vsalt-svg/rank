import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function forgeName(name: string, stamp: string) {
  const dot = name.lastIndexOf('.');
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : '';
  const clean = stamp.trim().replace(/[^\w-]+/g, '-').slice(0, 40);
  return `${base}${clean ? '-' + clean : ''}${ext}`;
}

export default function SmithyPage() {
  const [stamp, setStamp] = useState('rank');
  const [out, setOut] = useState<string[]>([]);

  const onFiles = (list: FileList | null) => {
    if (!list?.length) return;
    setOut([...list].map((f) => forgeName(f.name, stamp)));
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">smithy</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">rename before you share.</h1>
          <p className="text-sm text-neutral-400 mb-6">local name forge. files never leave this tab. stamp a suffix, preview the public-looking names.</p>
          <input
            value={stamp}
            onChange={(e) => setStamp(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none mb-5"
            placeholder="stamp"
          />
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white font-medium">drop to preview names</p>
          </label>
          {out.length > 0 && (
            <ul className="mt-6 space-y-2">
              {out.map((n) => (
                <li key={n} className="text-sm text-neutral-200 font-mono break-all">{n}</li>
              ))}
            </ul>
          )}
        </motion.div>
      </div>
    </div>
  );
}
