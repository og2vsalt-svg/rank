import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { shareUrls } from '../lib/cloudShare';

export default function RelayPage() {
  const { addFiles, togglePublic } = useVault();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');
  const [app, setApp] = useState('');
  const [picked, setPicked] = useState('');

  const send = async (list: FileList | null) => {
    if (!list?.length) return;
    const f = list[0];
    setPicked(f.name);
    setWarn(f.size > 40 * 1024 * 1024 ? 'big file. no cap, the tab might feel sleepy while it encodes.' : '');
    setErr('');
    setBusy(true);
    try {
      const stamped = note.trim()
        ? new File([f], `${f.name.replace(/\.[^.]+$/, '')} — ${note.trim().slice(0, 40)}${f.name.includes('.') ? f.name.slice(f.name.lastIndexOf('.')) : ''}`, { type: f.type })
        : f;
      const result = await addFiles([stamped], 'relay');
      if (!result.ok || !result.ids?.[0]) {
        setErr(result.error || 'could not save — log in first');
        return;
      }
      const pub = await togglePublic(result.ids[0]);
      if (!pub.ok) {
        setErr(pub.error || 'saved locally, cloud publish missed');
        return;
      }
      const urls = shareUrls(result.ids[0]);
      setApp(urls.app);
      setEmbed(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
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
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">relay</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">hand a file across with a note on it.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            write a short slip, attach a local file, publish to the share db. discord gets the same /s embed as every other public link.
          </p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="optional note that rides on the filename"
            className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-[#0a84ff]/50 mb-4"
          />
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition-all duration-300"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              send(e.dataTransfer.files);
            }}
          >
            <input type="file" className="hidden" onChange={(e) => send(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'relaying…' : picked || 'drop or click a file'}</p>
            <p className="text-xs text-neutral-500 mt-2">no size cap. only a slowness warning.</p>
          </label>
          {warn && <p className="text-amber-300/80 text-xs mt-4">{warn}</p>}
          {err && <p className="text-red-400 text-xs mt-4">{err}</p>}
          {embed && (
            <div className="mt-6 space-y-3">
              <div className="rounded-2xl bg-black/30 p-4">
                <p className="text-[11px] uppercase tracking-wide text-neutral-500 mb-1">discord embed</p>
                <p className="text-sm break-all text-[#0a84ff]">{embed}</p>
              </div>
              <div className="rounded-2xl bg-black/30 p-4">
                <p className="text-[11px] uppercase tracking-wide text-neutral-500 mb-1">app link</p>
                <p className="text-sm break-all text-neutral-300">{app}</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
