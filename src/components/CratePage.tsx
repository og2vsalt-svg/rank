import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { useRouter } from './Router';
import { shareUrls } from '../lib/cloudShare';

function formatBytes(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  return (n / (1024 * 1024)).toFixed(2) + ' mb';
}

export default function CratePage() {
  const { addFiles, togglePublic } = useVault();
  const { navigate } = useRouter();
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [drops, setDrops] = useState<{ id: string; name: string; size: number; link: string }[]>([]);

  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    const files = [...list];
    const total = files.reduce((s, f) => s + f.size, 0);
    setWarn(total > 40 * 1024 * 1024 ? 'fat crate. encode + upload might feel sleepy. no hard cap.' : '');
    setErr('');
    setBusy(true);
    const next: { id: string; name: string; size: number; link: string }[] = [];
    try {
      for (const file of files) {
        const blobList = new DataTransfer();
        blobList.items.add(file);
        const result = await addFiles(blobList.files, 'inbox');
        if (!result.ok || !result.ids?.[0]) {
          setErr(result.error || 'could not stash one of the files');
          continue;
        }
        const id = result.ids[0];
        const pub = await togglePublic(id);
        if (!pub.ok) {
          setErr(pub.error || 'saved but cloud publish missed a file');
        }
        next.push({ id, name: file.name, size: file.size, link: shareUrls(id).embed });
      }
      setDrops((prev) => [...next, ...prev]);
    } catch (e: any) {
      setErr(e?.message || 'crate failed');
    } finally {
      setBusy(false);
    }
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
          <p className="text-[#0a84ff] text-sm mb-2">crate</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">bulk local upload.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            dump a pile of files. each one hits the vault then the public db. discord-ready embed links included.
          </p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition">
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'shipping crate…' : 'drop a stack here'}</p>
            <p className="text-xs text-neutral-500 mt-2">no file cap. huge piles just warn you first.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {drops.length > 0 && (
            <ul className="mt-6 space-y-2">
              {drops.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.03] px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{d.name}</p>
                    <p className="text-[11px] text-neutral-500">{formatBytes(d.size)}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => navigate('share', d.id)} className="text-xs px-3 py-1.5 rounded-full bg-white text-black">open</button>
                    <button
                      onClick={() => navigator.clipboard.writeText(d.link)}
                      className="text-xs px-3 py-1.5 rounded-full bg-white/5"
                    >
                      copy embed
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </div>
    </div>
  );
}
