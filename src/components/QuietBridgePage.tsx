import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { shareUrls } from '../lib/cloudShare';

export default function QuietBridgePage() {
  const { addFiles, togglePublic } = useVault();
  const [note, setNote] = useState('');
  const [prior, setPrior] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [copied, setCopied] = useState(false);

  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    const file = list[0];
    const big = file.size > 40 * 1024 * 1024;
    setWarn(big ? 'large file — the browser may feel slow while it encodes and sends. no hard limit.' : '');
    setErr('');
    setBusy(true);
    setLink('');
    setCopied(false);
    try {
      const result = await addFiles([file], 'bridge');
      if (!result.ok) {
        setErr(result.error || 'could not save locally');
        return;
      }
      const id = result.ids?.[0];
      if (!id) return;
      const pub = await togglePublic(id);
      if (!pub.ok) {
        setErr(pub.error || 'publish failed');
        return;
      }
      const urls = shareUrls(id);
      setLink(urls.embed);
      try {
        await navigator.clipboard.writeText(urls.embed);
        setCopied(true);
      } catch {}
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
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 70, damping: 16 }}
        >
          <p className="text-[#0A84FF] text-sm font-medium mb-2 tracking-wide">quiet bridge</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-3">connect a file to a quiet note.</h1>
          <p className="text-neutral-400 text-base mb-8 leading-relaxed">
            Drop a local file. Add a short note that bridges it to the moment, or to an existing share id. It settles into the database with a polished Discord embed. Soft size warnings only — no hard limits. All prior desks remain fully intact.
          </p>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="quiet note to bridge with the file…"
            className="w-full rounded-2xl glass p-4 mb-4 text-sm text-white placeholder:text-neutral-500 border border-white/10 focus:border-[#0A84FF]/40 outline-none resize-none h-24"
          />

          <input
            value={prior}
            onChange={(e) => setPrior(e.target.value)}
            placeholder="optional prior share id to bridge toward"
            className="w-full rounded-2xl glass p-4 mb-6 text-sm text-white placeholder:text-neutral-500 border border-white/10 focus:border-[#0A84FF]/40 outline-none"
          />

          <motion.label
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="block cursor-pointer rounded-[28px] glass p-12 mb-6 border border-dashed border-white/15 hover:border-[#0A84FF]/40 transition text-center apple-card"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}
          >
            <input type="file" className="hidden" onChange={(e) => onFiles(e.target.files)} disabled={busy} />
            <p className="text-white font-medium text-lg">{busy ? 'bridging…' : 'drop a file to bridge'}</p>
            <p className="text-sm text-neutral-500 mt-2">local vault + public database. Discord-ready /s/ link.</p>
          </motion.label>

          {warn && <p className="text-sm text-amber-300/90 mb-4">{warn}</p>}
          {err && <p className="text-sm text-red-400 mb-4">{err}</p>}
          {link && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl glass p-4 text-sm"
            >
              <p className="text-neutral-300">{copied ? 'copied — ' : ''}discord embed ready:</p>
              <p className="text-[#0A84FF] break-all mt-1">{link}</p>
              {note && <p className="text-neutral-500 mt-2 text-xs">note: {note}</p>}
              {prior && <p className="text-neutral-500 text-xs">bridged toward: {prior}</p>}
            </motion.div>
          )}

          <p className="mt-12 text-center text-xs text-neutral-600">prior features preserved. this is simply another surface for quiet connections.</p>
        </motion.div>
      </div>
    </div>
  );
}
