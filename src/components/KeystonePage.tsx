import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { useRouter } from './Router';
import { shareUrls } from '../lib/cloudShare';

export default function KeystonePage() {
  const { addFiles, togglePublic } = useVault();
  const { navigate } = useRouter();
  const [note, setNote] = useState('');
  const { files } = useVault() as any;
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [id, setId] = useState<string | null>(null);
  const [embed, setEmbed] = useState('');

  const pin = async (list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    setWarn(f.size > 40 * 1024 * 1024 ? 'heavy file. pinning can feel slow. no cap.' : '');
    setErr('');
    setBusy(true);
    try {
      const result = await addFiles(list, note.trim() || 'keystone');
      if (!result.ok) {
        setErr(result.error || 'log in first');
        return;
      }
      const next = result.ids?.[0];
      if (!next) {
        setErr('saved but no id');
        return;
      }
      const pub = await togglePublic(next);
      if (!pub.ok) {
        setErr(pub.error || 'vault ok, publish missed');
        setId(next);
        return;
      }
      setId(next);
      const urls = shareUrls(next);
      setEmbed(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'keystone failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">keystone</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">pin one file as the featured drop.</h1>
          <p className="text-neutral-400 text-sm mb-6">single file, public db row, discord-ready /s link. vault still keeps a copy.</p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="optional note on the stone"
            rows={3}
            className="w-full mb-4 bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-[#0a84ff]/50 resize-none"
          />
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition-all duration-300" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); pin(e.dataTransfer.files); }}>
            <input type="file" className="hidden" onChange={(e) => pin(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'pinning…' : 'drop the featured file'}</p>
            <p className="text-xs text-neutral-500 mt-2">no size lock. huge files just warn.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {id && (
            <div className="mt-6 space-y-2">
              <p className="text-xs text-neutral-400 break-all">discord embed: {embed}</p>
              <div className="flex flex-wrap gap-2">
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
