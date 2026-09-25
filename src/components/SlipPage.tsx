import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { useRouter } from './Router';
import { shareUrls } from '../lib/cloudShare';

export default function SlipPage() {
  const { addFiles, togglePublic } = useVault();
  const { navigate } = useRouter();
  const [hours, setHours] = useState('24');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [id, setId] = useState<string | null>(null);
  const [link, setLink] = useState('');

  const onFiles = async (list: FileList | null) => {
    const file = list?.[0];
    if (!file) return;
    setWarn(file.size > 40 * 1024 * 1024 ? 'big slip. this tab might nap while it encodes. still no cap.' : '');
    setErr('');
    setLink('');
    setBusy(true);
    try {
      const result = await addFiles([file] as unknown as FileList, 'inbox');
      if (!result.ok) {
        setErr(result.error || 'log in so the slip can land in the vault first');
        return;
      }
      const next = result.ids?.[0];
      if (!next) {
        setErr('saved but no id');
        return;
      }
      const pub = await togglePublic(next);
      if (!pub.ok) {
        setErr(pub.error || 'local ok, cloud publish failed');
        setId(next);
        return;
      }
      setId(next);
      const urls = shareUrls(next);
      setLink(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'slip failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">slip</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">hand someone a paper-thin drop.</h1>
          <p className="text-neutral-400 text-sm mb-6">upload a local file to the public share table and copy the /s/ embed. pick how long you mean it to live as a reminder — no hard file cap, just a slowness warning.</p>
          <label className="block text-xs text-neutral-500 mb-2">intended window</label>
          <select value={hours} onChange={(e) => setHours(e.target.value)} className="mb-6 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none">
            <option value="1">about an hour</option>
            <option value="24">about a day</option>
            <option value="168">about a week</option>
            <option value="0">keep it around</option>
          </select>
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition-all duration-300"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}
          >
            <input type="file" className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'printing the slip…' : 'drop a local file'}</p>
            <p className="text-xs text-neutral-500 mt-2">publishes to the db. discord unfurl hits /s/id.</p>
          </label>
          {hours !== '0' && <p className="text-xs text-neutral-500 mt-4">reminder only: think of this slip as ~{hours}h. expiry still follows whatever the share row already supports.</p>}
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {id && !err && (
            <div className="mt-6 space-y-2">
              {link && <p className="text-xs text-neutral-400 break-all">embed (copied): {link}</p>}
              <div className="flex flex-wrap gap-2">
                <button onClick={() => navigate('share', id)} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium active:scale-[0.98] transition-transform">open share</button>
                <button onClick={() => navigate('drop')} className="px-5 py-2.5 rounded-full bg-white/5 text-sm">plain drop</button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
