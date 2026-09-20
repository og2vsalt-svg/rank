import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { useRouter } from './Router';
import { shareUrls } from '../lib/cloudShare';

export default function SnapshotPage() {
  const { addFiles, togglePublic } = useVault();
  const { navigate } = useRouter();
  const [preview, setPreview] = useState('');
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);

  const ingest = async (file: File) => {
    setErr('');
    setLink('');
    setWarn(file.size > 40 * 1024 * 1024 ? 'chunky snap. tab might feel sleepy while it encodes.' : '');
    setPreview(URL.createObjectURL(file));
    setBusy(true);
    try {
      const list = new DataTransfer();
      list.items.add(file);
      const result = await addFiles(list.files, 'inbox');
      if (!result.ok) {
        setErr(result.error || 'could not keep this snap');
        return;
      }
      const id = result.ids?.[0];
      if (!id) return;
      const pub = await togglePublic(id);
      if (pub.ok) setLink(shareUrls(id).embed);
      else setErr(pub.error || 'kept locally, cloud publish missed');
    } catch (e: any) {
      setErr(e?.message || 'snap failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">snapshot</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">paste a screenshot.</h1>
          <p className="text-sm text-neutral-400 mb-6">ctrl/cmd+v a still, or pick one. it lands in the vault and can go public with a discord-ready /s/ link.</p>
          <div
            tabIndex={0}
            onPaste={(e) => {
              const item = [...e.clipboardData.items].find((i) => i.type.startsWith('image/'));
              const f = item?.getAsFile();
              if (f) ingest(f);
            }}
            className="rounded-[24px] border border-dashed border-white/15 p-10 text-center outline-none focus:border-[#0a84ff]/50"
          >
            <p className="text-white font-medium">{busy ? 'publishing…' : 'click here and paste'}</p>
            <p className="text-xs text-neutral-500 mt-2">no file cap. only a slowness warning if it is huge.</p>
            <label className="inline-block mt-4 text-xs text-[#0a84ff] cursor-pointer">
              or pick a file
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && ingest(e.target.files[0])} />
            </label>
          </div>
          {preview && <img src={preview} alt="" className="mt-6 w-full rounded-2xl" />}
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {link && (
            <div className="mt-5 flex flex-wrap gap-2">
              <p className="text-xs text-neutral-400 break-all w-full">{link}</p>
              <button onClick={() => navigate('vault')} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">open vault</button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
