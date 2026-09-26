import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { useRouter } from './Router';
import { shareUrls } from '../lib/cloudShare';

function hueFromName(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return h;
}

export default function LumenPage() {
  const { addFiles, togglePublic, setColor } = useVault();
  const { navigate } = useRouter();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [lastId, setLastId] = useState<string | null>(null);
  const hue = useMemo(() => hueFromName(name || 'lumen'), [name]);

  const onFiles = async (list: FileList | null) => {
    const file = list?.[0];
    if (!file) return;
    setName(file.name);
    setWarn(file.size > 40 * 1024 * 1024 ? 'bright but heavy. tab may lag. no cap.' : '');
    setErr('');
    setBusy(true);
    try {
      const result = await addFiles([file], 'drops');
      if (!result.ok || !result.ids?.[0]) {
        setErr(result.error || 'could not keep file');
        return;
      }
      const color = `hsl(${hueFromName(file.name)} 70% 55%)`;
      setColor(result.ids[0], color);
      const pub = await togglePublic(result.ids[0]);
      if (!pub.ok) {
        setErr(pub.error || 'saved but publish failed');
        setLastId(result.ids[0]);
        return;
      }
      setLastId(result.ids[0]);
      try { await navigator.clipboard.writeText(shareUrls(result.ids[0]).embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'lumen missed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8 overflow-hidden">
          <p className="text-[#0a84ff] text-sm mb-2">lumen</p>
          <h1 className="text-3xl font-semibold mb-3 tracking-tight">color from the name.</h1>
          <p className="text-neutral-400 text-sm mb-6">hash a filename into a hue, stamp the vault file, publish one drop. discord still gets /s.</p>
          <div className="h-24 rounded-[24px] mb-6 transition-all duration-500" style={{ background: `linear-gradient(135deg, hsl(${hue} 80% 58%), hsl(${(hue + 40) % 360} 70% 42%))` }} />
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}>
            <input type="file" className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'tinting…' : 'drop one file'}</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {lastId && !err && (
            <div className="mt-6 flex flex-wrap gap-2">
              <button onClick={() => navigate('share', lastId)} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">open share</button>
              <button onClick={() => navigate('vault')} className="px-5 py-2.5 rounded-full bg-white/5 text-sm">vault</button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
