import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { useRouter } from './Router';
import { shareUrls } from '../lib/cloudShare';

export default function LoomPage() {
  const { files } = useVault() as any;
  const { navigate } = useRouter();
  const [picked, setPicked] = useState<string[]>([]);
  const list = files || [];
  const huge = list.some((f: any) => (f.size || 0) > 40 * 1024 * 1024);

  const thread = useMemo(
    () => picked.map((id) => list.find((f: any) => f.id === id)).filter(Boolean),
    [picked, list],
  );

  const toggle = (id: string) => {
    setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const exportText = thread
    .map((f: any, i: number) => `${i + 1}. ${f.name} — ${shareUrls(f.id).app}`)
    .join('\n');

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
          <p className="text-[#0a84ff] text-sm mb-2">loom</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">weave a share thread.</h1>
          <p className="text-neutral-400 text-sm mb-6">pick vault files in order, copy a playlist of links. not another vault — just a sequence you can drop in discord.</p>
          {huge && <p className="text-xs text-amber-300/80 mb-4">some of these are chunky. weaving is fine, previews might hitch.</p>}
          {list.length === 0 && <p className="text-sm text-neutral-500">vault is empty. drop something first.</p>}
          <ul className="space-y-2 mb-6">
            {list.slice(0, 40).map((f: any) => {
              const on = picked.includes(f.id);
              return (
                <li key={f.id}>
                  <button
                    onClick={() => toggle(f.id)}
                    className={`w-full text-left rounded-2xl px-4 py-3 border transition ${on ? 'bg-[#0a84ff]/15 border-[#0a84ff]/30' : 'bg-white/[0.03] border-white/5 hover:border-white/15'}`}
                  >
                    <p className="text-sm text-white truncate">{f.name}</p>
                    <p className="text-[11px] text-neutral-500">{((f.size || 0) / 1024).toFixed(1)} kb</p>
                  </button>
                </li>
              );
            })}
          </ul>
          {thread.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs text-neutral-400 whitespace-pre-wrap break-all">{exportText}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => navigator.clipboard.writeText(exportText).catch(() => {})}
                  className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium"
                >
                  copy thread
                </button>
                <button onClick={() => navigate('drop')} className="px-5 py-2.5 rounded-full bg-white/5 text-sm">add more</button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
