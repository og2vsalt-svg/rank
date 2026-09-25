import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { publishShare, shareUrls } from '../lib/cloudShare';

export default function RookeryPage() {
  const { addFiles } = useVault();
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [cards, setCards] = useState<{ name: string; embed: string; app: string }[]>([]);
  const [err, setErr] = useState('');

  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    const big = [...list].some((f) => f.size > 40 * 1024 * 1024);
    setWarn(big ? 'one of these is huge. tab might stutter while it encodes. still no file cap.' : '');
    setErr('');
    setBusy(true);
    const next: { name: string; embed: string; app: string }[] = [];
    try {
      const result = await addFiles(list, 'inbox');
      if (!result.ok) {
        setErr(result.error || 'need a logged in vault to nest these');
        return;
      }
      const ids = result.ids || [];
      for (let i = 0; i < list.length; i++) {
        const file = list[i];
        const id = ids[i];
        if (!id) continue;
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(String(r.result || ''));
          r.onerror = () => reject(new Error('read failed'));
          r.readAsDataURL(file);
        });
        const pub = await publishShare({
          id,
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl,
          author: 'rookery',
        });
        if (!pub.ok) continue;
        const urls = shareUrls(pub.id || id);
        next.push({ name: file.name, embed: urls.embed, app: urls.app });
      }
      setCards(next);
    } catch (e: any) {
      setErr(e?.message || 'rookery failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">rookery</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">nest a bunch of files, hatch embed cards.</h1>
          <p className="text-neutral-400 text-sm mb-6">drop several local files. each one goes to the db and comes back as a /s/ link discord can preview like a real product card.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}>
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'nesting…' : 'drop a flock of files'}</p>
            <p className="text-xs text-neutral-500 mt-2">warnings only if it gets slow. no hard limit.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {cards.length > 0 && (
            <div className="mt-6 space-y-2">
              {cards.map((c) => (
                <div key={c.embed} className="rounded-2xl bg-black/30 border border-white/8 px-4 py-3">
                  <p className="text-sm text-white truncate">{c.name}</p>
                  <p className="text-[11px] text-neutral-500 break-all mt-1">{c.embed}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
