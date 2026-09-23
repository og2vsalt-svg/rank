import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { useRouter } from './Router';
import { shareUrls } from '../lib/cloudShare';

export default function WickPage() {
  const { addFiles, togglePublic } = useVault();
  const { navigate } = useRouter();
  const [hours, setHours] = useState(24);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [link, setLink] = useState('');

  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    setBusy(true);
    setMsg('');
    setLink('');
    try {
      const result = await addFiles(list, 'inbox');
      if (!result.ok) {
        setMsg(result.error || 'could not save');
        return;
      }
      const id = result.ids?.[0];
      if (!id) {
        setMsg('saved without an id');
        return;
      }
      const pub = await togglePublic(id);
      if (!pub.ok) {
        setMsg(pub.error || 'saved but not public');
        return;
      }
      const urls = shareUrls(id);
      setLink(urls.embed);
      setMsg(
        result.warn ||
          `live for about ${hours}h on the share page if the host honors expires. embed url copied for discord.`,
      );
      try {
        await navigator.clipboard.writeText(urls.embed);
      } catch {}
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">wick</p>
          <h1 className="text-3xl font-semibold mb-3">drop with a fuse.</h1>
          <p className="text-neutral-400 text-sm mb-6">same public share flow, just a reminder that the embed card should look like a timed drop. no hard file cap.</p>
          <label className="block text-xs text-neutral-500 mb-2">suggested hours</label>
          <input
            type="range"
            min={1}
            max={168}
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            className="w-full mb-2"
          />
          <p className="text-sm text-neutral-300 mb-6">{hours} hours</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition">
            <input type="file" className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'lighting…' : 'pick a file'}</p>
          </label>
          {msg && <p className="text-xs text-amber-200/80 mt-4">{msg}</p>}
          {link && (
            <div className="mt-4 flex flex-wrap gap-2">
              <p className="text-xs text-neutral-500 break-all w-full">{link}</p>
              <button onClick={() => navigate('glyph')} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">preview discord card</button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
