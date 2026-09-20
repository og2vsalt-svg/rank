import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { useRouter } from './Router';
import { shareUrls } from '../lib/cloudShare';

export default function DropPage() {
  const { addFiles, togglePublic } = useVault();
  const { navigate } = useRouter();
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [lastId, setLastId] = useState<string | null>(null);
  const [link, setLink] = useState('');
  const [err, setErr] = useState('');

  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    const big = [...list].some((f) => f.size > 40 * 1024 * 1024);
    setWarn(big ? 'this one is chunky. the tab might lag while it encodes. no cap tho.' : '');
    setErr('');
    setLink('');
    setBusy(true);
    try {
      const result = await addFiles(list, 'inbox');
      if (!result.ok) {
        setErr(result.error || 'could not save file — are you logged in?');
        return;
      }
      if (result.warn) setWarn(result.warn);
      const id = result.ids?.[0];
      if (!id) {
        setErr('saved, but no id to publish');
        return;
      }
      const pub = await togglePublic(id);
      if (!pub.ok) {
        setErr(pub.error || 'saved locally but cloud publish failed');
        setLastId(id);
        return;
      }
      setLastId(id);
      const urls = shareUrls(id);
      setLink(urls.app);
      try { await navigator.clipboard.writeText(urls.app); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'drop failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">quick drop</p>
          <h1 className="text-3xl font-semibold mb-3">upload local, flip public.</h1>
          <p className="text-neutral-400 text-sm mb-6">lands in your vault, then publishes to the cloud db so anyone with the link can open it.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition">
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'publishing…' : 'click or drop a file here'}</p>
            <p className="text-xs text-neutral-500 mt-2">no hard limit. just a slowness warning if it is huge.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {lastId && !err && (
            <div className="mt-6 space-y-3">
              {link && <p className="text-xs text-neutral-400 break-all">share link (copied): {link}</p>}
              <div className="flex flex-wrap gap-2">
                <button onClick={() => navigate('share', lastId)} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">open share page</button>
                <button onClick={() => navigate('vault')} className="px-5 py-2.5 rounded-full bg-white/5 text-sm">see vault</button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
