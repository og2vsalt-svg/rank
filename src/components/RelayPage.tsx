import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { useRouter } from './Router';
import { shareUrls } from '../lib/cloudShare';

export default function RelayPage() {
  const { addFiles, togglePublic } = useVault();
  const { navigate } = useRouter();
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [links, setLinks] = useState<{ id: string; name: string; embed: string }[]>([]);

  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    const files = [...list];
    const chunky = files.some((f) => f.size > 40 * 1024 * 1024);
    setWarn(chunky ? 'one of these is huge. the tab might hitch while it encodes. still no hard cap.' : '');
    setErr('');
    setBusy(true);
    const out: { id: string; name: string; embed: string }[] = [];
    try {
      for (const file of files) {
        const dt = new DataTransfer();
        dt.items.add(file);
        const result = await addFiles(dt.files, 'inbox');
        if (!result.ok) {
          setErr(result.error || 'could not save — log in?');
          continue;
        }
        const id = result.ids?.[0];
        if (!id) continue;
        const pub = await togglePublic(id);
        if (!pub.ok) {
          setErr(pub.error || 'cloud publish failed on one file');
          continue;
        }
        const urls = shareUrls(id);
        out.push({ id, name: file.name, embed: urls.embed });
      }
      setLinks(out);
      if (out[0]) {
        try { await navigator.clipboard.writeText(out.map((l) => l.embed).join('\n')); } catch {}
      }
    } catch (e: any) {
      setErr(e?.message || 'relay failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">relay</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">batch drop. one desk.</h1>
          <p className="text-neutral-400 text-sm mb-6">not the vault grid. pick a handful of local files, each one lands in the cloud db and gets its own discord-ready embed link.</p>
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition-colors duration-300"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'relaying…' : 'drop a stack here'}</p>
            <p className="text-xs text-neutral-500 mt-2">no file size cap. just a slowness warning if something is massive.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {links.length > 0 && (
            <div className="mt-6 space-y-2">
              {links.map((l) => (
                <button key={l.id} onClick={() => navigate('share', l.id)} className="w-full text-left rounded-2xl bg-white/5 hover:bg-white/8 px-4 py-3 transition-colors">
                  <p className="text-sm text-white truncate">{l.name}</p>
                  <p className="text-[11px] text-neutral-500 break-all">{l.embed}</p>
                </button>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
