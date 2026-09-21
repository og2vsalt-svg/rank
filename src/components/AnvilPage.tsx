import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';

export default function AnvilPage() {
  const { files, renameFile, setTags, folders, moveFile } = useVault();
  const [prefix, setPrefix] = useState('');
  const [tag, setTag] = useState('');
  const [folder, setFolder] = useState(folders[0] || 'inbox');
  const [msg, setMsg] = useState('');

  const stamp = () => {
    const clean = prefix.trim();
    if (!clean) return;
    files.forEach((f) => {
      if (!f.name.startsWith(clean)) renameFile(f.id, `${clean}-${f.name}`);
    });
    setMsg(`stamped ${files.length} names`);
  };

  const tagAll = () => {
    const t = tag.trim().toLowerCase();
    if (!t) return;
    files.forEach((f) => setTags(f.id, [...f.tags, t]));
    setMsg(`tagged ${files.length} with ${t}`);
  };

  const dump = () => {
    files.forEach((f) => moveFile(f.id, folder));
    setMsg(`moved ${files.length} into ${folder}`);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[28px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">anvil</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">batch rename desk</h1>
          <p className="text-sm text-neutral-500 mb-6">work the labels, not the bytes. prefix names, slap a tag, or shove everything into one folder.</p>
          <p className="text-xs text-neutral-500 mb-4">{files.length} live files in the vault</p>
          <div className="space-y-4">
            <div className="flex gap-2">
              <input value={prefix} onChange={(e) => setPrefix(e.target.value)} placeholder="prefix" className="flex-1 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none" />
              <button onClick={stamp} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">stamp</button>
            </div>
            <div className="flex gap-2">
              <input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="tag" className="flex-1 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none" />
              <button onClick={tagAll} className="px-5 py-2.5 rounded-full bg-white/5 text-sm">tag all</button>
            </div>
            <div className="flex gap-2">
              <select value={folder} onChange={(e) => setFolder(e.target.value)} className="flex-1 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none">
                {folders.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
              <button onClick={dump} className="px-5 py-2.5 rounded-full bg-white/5 text-sm">move all</button>
            </div>
          </div>
          {msg && <p className="text-xs text-neutral-400 mt-4">{msg}</p>}
        </motion.div>
      </div>
    </div>
  );
}
