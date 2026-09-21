import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

type Item = { name: string; id: string; embed: string; warn?: string | null };

export default function DuskPage() {
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');

  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    setBusy(true);
    setErr('');
    const files = Array.from(list);
    const total = files.reduce((n, f) => n + f.size, 0);
    setWarn(total > 40 * 1024 * 1024 ? 'heavy dusk queue. encoding can feel slow. no file cap besides that lag.' : '');
    const next: Item[] = [];
    try {
      for (const file of files) {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ''));
          reader.onerror = () => reject(new Error('read failed'));
          reader.readAsDataURL(file);
        });
        const id = uid();
        const pub = await publishShare({
          id,
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl,
        });
        if (!pub.ok) throw new Error(pub.error || 'publish failed');
        next.push({ name: file.name, id, embed: shareUrls(id).embed, warn: pub.warn });
      }
      setItems((prev) => [...next, ...prev]);
      try {
        await navigator.clipboard.writeText(next.map((i) => i.embed).join('\n'));
      } catch {}
    } catch (e: any) {
      setErr(e?.message || 'dusk failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">dusk</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">batch public drops.</h1>
          <p className="text-sm text-neutral-500 mb-6">pick a handful of local files. each one lands in the share db and gets a discord-ready /s/ embed.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition">
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'sending dusk…' : 'choose files'}</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          <ul className="mt-6 space-y-3">
            {items.map((it) => (
              <li key={it.id} className="rounded-2xl bg-white/5 px-4 py-3">
                <p className="text-sm text-white truncate">{it.name}</p>
                <p className="text-[11px] text-neutral-500 break-all mt-1">{it.embed}</p>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
