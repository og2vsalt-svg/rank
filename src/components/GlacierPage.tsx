import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';

function thawAt(hours: number) {
  return new Date(Date.now() + hours * 3600 * 1000).toISOString();
}

export default function GlacierPage() {
  const { files, addFiles } = useVault();
  const [hours, setHours] = useState(24);
  const [warn, setWarn] = useState('');
  const [note, setNote] = useState('');
  const frozen = useMemo(
    () => files.filter((f) => (f as any).expiresAt && +new Date((f as any).expiresAt) > Date.now()),
    [files],
  );

  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    const big = [...list].some((f) => f.size > 40 * 1024 * 1024);
    setWarn(big ? 'huge freeze. encoding might feel icy-slow. no cap.' : '');
    const result = await addFiles(list, 'glacier');
    if (!result.ok) setNote(result.error || 'could not freeze — sign in first');
    else setNote(`held until ${new Date(thawAt(hours)).toLocaleString()}. files stay in vault.`);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">glacier</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">park a file on ice.</h1>
          <p className="text-sm text-neutral-400 mb-6">not a vault clone. this desk is a delay shelf — drop something, pick a thaw window, keep it local until that clock.</p>
          <label className="block mb-4 text-xs text-neutral-500">
            thaw in hours
            <input type="range" min={1} max={168} value={hours} onChange={(e) => setHours(Number(e.target.value))} className="w-full mt-2" />
            <span className="text-neutral-300">{hours}h · {new Date(thawAt(hours)).toLocaleString()}</span>
          </label>
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white font-medium">drop to freeze</p>
            <p className="text-xs text-neutral-500 mt-2">no size cap. big files just warn you.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {note && <p className="text-xs text-neutral-400 mt-4">{note}</p>}
          {frozen.length > 0 && (
            <ul className="mt-6 space-y-2">
              {frozen.slice(0, 8).map((f) => (
                <li key={f.id} className="text-sm text-neutral-300 flex justify-between gap-3">
                  <span className="truncate">{f.name}</span>
                  <span className="text-neutral-500 text-xs shrink-0">{(f.size / 1024).toFixed(0)} kb</span>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </div>
    </div>
  );
}
