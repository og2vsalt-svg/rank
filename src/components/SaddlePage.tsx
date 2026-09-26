import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { useRouter } from './Router';
import { shareUrls } from '../lib/cloudShare';

export default function SaddlePage() {
  const { addFiles, togglePublic } = useVault();
  const { navigate } = useRouter();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [lastId, setLastId] = useState<string | null>(null);

  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    const f = list[0];
    setWarn(f.size > 40 * 1024 * 1024 ? 'chunky file. encoding may feel slow. no hard cap.' : '');
    setErr('');
    setLink('');
    setBusy(true);
    try {
      const result = await addFiles(list, note.trim() || 'saddle');
      if (!result.ok) {
        setErr(result.error || 'could not save — log in first?');
        return;
      }
      const id = result.ids?.[0];
      if (!id) {
        setErr('saved, missing id');
        return;
      }
      const pub = await togglePublic(id);
      if (!pub.ok) {
        setErr(pub.error || 'local save ok, cloud publish missed');
        setLastId(id);
        return;
      }
      setLastId(id);
      const urls = shareUrls(id);
      setLink(urls.app);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'saddle failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">saddle</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">strap a file to a note.</h1>
          <p className="text-neutral-400 text-sm mb-6">local upload lands in the vault, then rides out as a public drop. discord unfurl uses /s/id.</p>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="optional waybill note"
            className="w-full mb-4 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/50 transition"
          />
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}
          >
            <input type="file" className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'cinching…' : 'drop one file on the saddle'}</p>
            <p className="text-xs text-neutral-500 mt-2">no size wall. just a slowness heads-up.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {lastId && !err && (
            <div className="mt-6 space-y-3">
              {link && <p className="text-xs text-neutral-400 break-all">app link: {link}</p>}
              <div className="flex flex-wrap gap-2">
                <button onClick={() => navigate('share', lastId)} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">open share</button>
                <button onClick={() => navigate('vault')} className="px-5 py-2.5 rounded-full bg-white/5 text-sm">vault</button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
