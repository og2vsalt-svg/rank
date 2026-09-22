import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { useRouter } from './Router';

function kind(type: string, name: string) {
  const t = (type || '').toLowerCase();
  const n = (name || '').toLowerCase();
  if (t.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/.test(n)) return 'image';
  if (t.startsWith('video/') || /\.(mp4|mov|webm)$/.test(n)) return 'video';
  if (t.startsWith('audio/') || /\.(mp3|wav|ogg|m4a)$/.test(n)) return 'audio';
  if (t.includes('pdf') || n.endsWith('.pdf')) return 'pdf';
  if (t.startsWith('text/') || /\.(txt|md|json|csv)$/.test(n)) return 'text';
  return 'other';
}

export default function CedarPage() {
  const { files } = useVault() as any;
  const { navigate } = useRouter();
  const [filter, setFilter] = useState('all');
  const list = files || [];
  const filtered = useMemo(
    () => list.filter((f: any) => filter === 'all' || kind(f.type, f.name) === filter),
    [list, filter],
  );
  const huge = list.some((f: any) => (f.size || 0) > 80 * 1024 * 1024);

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
          <p className="text-[#0a84ff] text-sm mb-2">cedar</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">sort the pile by grain.</h1>
          <p className="text-neutral-400 text-sm mb-6">filter vault files by type. no upload. no cap.</p>
          <div className="flex flex-wrap gap-2 mb-5">
            {['all', 'image', 'video', 'audio', 'pdf', 'text', 'other'].map((k) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={`px-3.5 py-1.5 rounded-full text-sm ${filter === k ? 'bg-white text-black' : 'bg-white/5 text-neutral-300'}`}
              >
                {k}
              </button>
            ))}
          </div>
          {huge && <p className="text-xs text-amber-300/80 mb-4">some files are huge. this list stays light.</p>}
          <ul className="space-y-2">
            {filtered.length === 0 && <li className="text-sm text-neutral-500">nothing in this grain yet.</li>}
            {filtered.slice(0, 80).map((f: any) => (
              <li key={f.id} className="rounded-2xl bg-white/[0.03] border border-white/5 px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-white truncate">{f.name}</p>
                  <p className="text-xs text-neutral-500">{kind(f.type, f.name)} · {((f.size || 0) / 1024).toFixed(1)} kb</p>
                </div>
                {f.isPublic && (
                  <button onClick={() => navigate('share', f.id)} className="shrink-0 text-xs text-[#0a84ff]">open share</button>
                )}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
