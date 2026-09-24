import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { shareUrls } from '../lib/cloudShare';

type Shot = { name: string; size: number; preview: string };

export default function PebblePage() {
  const { addFiles, togglePublic } = useVault();
  const [shots, setShots] = useState<Shot[]>([]);
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const ingest = async (list: FileList | null) => {
    if (!list?.length) return;
    const files = [...list];
    const heavy = files.some((f) => f.size > 40 * 1024 * 1024);
    setWarn(heavy ? 'one of these is huge. preview may lag. no cap, just a heads up.' : '');
    const next: Shot[] = [];
    for (const f of files) {
      if (!f.type.startsWith('image/') && !f.type.startsWith('video/')) continue;
      const preview = URL.createObjectURL(f);
      next.push({ name: f.name, size: f.size, preview });
    }
    setShots((s) => [...next, ...s].slice(0, 24));
    setBusy(true); setErr(''); setLink('');
    try {
      const result = await addFiles(list, 'inbox');
      if (!result.ok) {
        setErr(result.error || 'could not park files');
        return;
      }
      const id = result.ids?.[0];
      if (!id) return;
      const pub = await togglePublic(id);
      if (pub.ok) {
        const urls = shareUrls(pub.id || id);
        setLink(urls.embed);
        try { await navigator.clipboard.writeText(urls.embed); } catch {}
      } else setErr(pub.error || 'saved locally, cloud miss');
    } catch (e: any) {
      setErr(e?.message || 'failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">pebble</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">drop stills. keep the first one public.</h1>
          <p className="text-neutral-400 text-sm mb-6">local previews stay on this tab. first file tries the cloud share so discord can unfurl /s links.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-8 text-center transition mb-6"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); ingest(e.dataTransfer.files); }}>
            <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={(e) => ingest(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'publishing first file…' : 'drop images or clips'}</p>
            <p className="text-xs text-neutral-500 mt-2">no hard limit. big files just feel slower.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mb-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mb-4">{err}</p>}
          {link && <p className="text-xs text-[#0a84ff] mb-4 break-all">embed (copied): {link}</p>}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {shots.map((s) => (
              <div key={s.preview} className="rounded-2xl overflow-hidden bg-white/5 border border-white/8">
                {s.preview.includes('blob:') && (
                  <img src={s.preview} alt="" className="w-full h-32 object-cover" />
                )}
                <p className="text-[11px] text-neutral-400 truncate px-2 py-1.5">{s.name}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
