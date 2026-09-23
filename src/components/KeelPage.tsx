import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { useRouter } from './Router';

export default function KeelPage() {
  const vault = useVault() as any;
  const { navigate } = useRouter();
  const files = vault.files || [];
  const [picked, setPicked] = useState<string[]>([]);

  const selected = useMemo(() => files.filter((f: any) => picked.includes(f.id)), [files, picked]);
  const total = selected.reduce((n: number, f: any) => n + (f.size || 0), 0);
  const huge = total > 80 * 1024 * 1024;

  const toggle = (id: string) => {
    setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const manifesto = selected
    .map((f: any) => `${f.name}\t${f.size || 0}\t${f.type || 'file'}\t${f.id}\t${f.public ? 'public' : 'local'}`)
    .join('\n');

  const copy = async () => {
    const header = 'name\tsize\tmime\tid\tstate\n';
    try {
      await navigator.clipboard.writeText(header + manifesto);
    } catch {}
  };

  const save = async () => {
    const body = `# keel manifest\n${new Date().toISOString()}\n\n${manifesto || '(empty)'}\n`;
    await vault.addText?.(`keel-${Date.now()}.txt`, body, 'keel');
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">keel</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">pack a shipping list.</h1>
          <p className="text-neutral-400 text-sm mb-6">tick files, get a manifest. not a vault grid — just the receipt you send with a drop.</p>
          {huge && <p className="text-xs text-amber-300/80 mb-4">this pile is chunky. listing is fine, the tab might feel sleepy if you preview all of it.</p>}
          {files.length === 0 && <p className="text-sm text-neutral-500 mb-4">vault is empty. drop something first.</p>}
          <ul className="space-y-2 max-h-72 overflow-auto mb-6">
            {files.slice(0, 80).map((f: any) => (
              <li key={f.id}>
                <button
                  onClick={() => toggle(f.id)}
                  className={`w-full text-left rounded-2xl px-4 py-3 border transition ${
                    picked.includes(f.id) ? 'bg-white/10 border-[#0a84ff]/40' : 'bg-white/[0.03] border-white/5'
                  }`}
                >
                  <p className="text-sm text-white truncate">{f.name}</p>
                  <p className="text-xs text-neutral-500">{((f.size || 0) / 1024).toFixed(1)} kb</p>
                </button>
              </li>
            ))}
          </ul>
          <p className="text-xs text-neutral-500 mb-4">{selected.length} picked · {(total / 1024).toFixed(1)} kb</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={copy} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">copy list</button>
            <button onClick={save} className="px-5 py-2.5 rounded-full bg-white/5 text-sm">save as file</button>
            <button onClick={() => navigate('drop')} className="px-5 py-2.5 rounded-full bg-white/5 text-sm">go drop</button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
