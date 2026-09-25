import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { useRouter } from './Router';
import { shareUrls } from '../lib/cloudShare';

export default function LintelPage() {
  const { addFiles, togglePublic } = useVault();
  const { navigate } = useRouter();
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [embed, setEmbed] = useState('');
  const [id, setId] = useState<string | null>(null);

  const onFiles = async (list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    setWarn(f.size > 40 * 1024 * 1024 ? 'chunky file. encoding may feel slow. no cap.' : '');
    setErr('');
    setLink('');
    setBusy(true);
    try {
      const result = await addFiles(list, caption.trim() || 'lintel');
      if (!result.ok) {
        setErr(result.error || 'could not save — log in first');
        return;
      }
      const nextId = result.ids?.[0];
      if (!nextId) {
        setErr('saved locally but no share id');
        return;
      }
      const pub = await togglePublic(nextId);
      if (!pub.ok) {
        setErr(pub.error || 'vault saved, cloud publish missed');
        setId(nextId);
        return;
      }
      setId(nextId);
      const urls = shareUrls(nextId);
      setLink(urls.app);
      setEmbed(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'lintel drop failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">lintel</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">frame a file, then hang the link.</h1>
          <p className="text-neutral-400 text-sm mb-6">local upload goes into the vault and the public db. discord unfurl uses the /s embed path.</p>
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="optional caption / folder"
            className="w-full mb-4 bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-[#0a84ff]/50"
          />
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}>
            <input type="file" className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'publishing…' : 'drop one file on the lintel'}</p>
            <p className="text-xs text-neutral-500 mt-2">no hard limit. huge files just warn.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {id && !err && (
            <div className="mt-6 space-y-2">
              <p className="text-xs text-neutral-400 break-all">app: {link}</p>
              <p className="text-xs text-neutral-400 break-all">discord embed: {embed}</p>
              <div className="flex flex-wrap gap-2 pt-2">
                <button onClick={() => navigate('share', id)} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">open share</button>
                <button onClick={() => navigate('vault')} className="px-5 py-2.5 rounded-full bg-white/5 text-sm">vault</button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
