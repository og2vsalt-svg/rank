import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(r.error || new Error('read failed'));
    r.readAsDataURL(file);
  });
}

type Item = {
  id: string;
  name: string;
  size: number;
  embed?: string;
  app?: string;
  error?: string;
  warn?: string;
};

export default function NexusPage() {
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [warn, setWarn] = useState('');

  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    const files = [...list];
    setWarn(files.some((f) => f.size > 40 * 1024 * 1024) ? 'at least one file is huge. encoding may lag. still no cap.' : '');
    setBusy(true);
    const next: Item[] = [];
    for (const file of files) {
      const id = uid();
      try {
        const dataUrl = await readAsDataUrl(file);
        const res = await publishShare({
          id,
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl,
        });
        const urls = shareUrls(id);
        next.push({
          id,
          name: file.name,
          size: file.size,
          embed: res.ok ? urls.embed : undefined,
          app: res.ok ? urls.app : undefined,
          error: res.ok ? undefined : res.error,
          warn: res.warn,
        });
      } catch (e: any) {
        next.push({ id, name: file.name, size: file.size, error: e?.message || 'failed' });
      }
      setItems([...next]);
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">nexus</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">batch drop to the share db.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            not another vault grid. pick a pile of local files, we publish each one and hand back discord /s cards.
          </p>
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition-all duration-300"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              onFiles(e.dataTransfer.files);
            }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'publishing the pile…' : 'drop a pile here'}</p>
            <p className="text-xs text-neutral-500 mt-2">unlimited count. we only warn if the browser might stall.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          <AnimatePresence>
            {items.map((it) => (
              <motion.div
                key={it.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 rounded-2xl bg-white/[0.04] border border-white/8 px-4 py-3"
              >
                <p className="text-sm text-white truncate">{it.name}</p>
                {it.error && <p className="text-xs text-red-400 mt-1">{it.error}</p>}
                {it.warn && <p className="text-xs text-amber-300/80 mt-1">{it.warn}</p>}
                {it.embed && <p className="text-xs text-neutral-400 break-all mt-1">{it.embed}</p>}
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
