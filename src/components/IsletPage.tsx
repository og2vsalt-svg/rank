import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { shareUrls } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return `${n} b`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} kb`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} mb`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} gb`;
}

export default function IsletPage() {
  const { addFiles, togglePublic } = useVault();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [note, setNote] = useState('');
  const [link, setLink] = useState('');
  const [warn, setWarn] = useState('');

  const publishText = async () => {
    const body = note.trim();
    if (!body) return;
    setErr('');
    setBusy(true);
    setWarn(body.length > 400_000 ? 'long note. no cap, but this tab might hitch encoding it.' : '');
    try {
      const file = new File([body], `islet-${Date.now()}.txt`, { type: 'text/plain' });
      const result = await addFiles([file], 'islet');
      if (!result.ok || !result.ids?.[0]) {
        setErr(result.error || 'could not save the note');
        return;
      }
      const pub = await togglePublic(result.ids[0]);
      if (!pub.ok) {
        setErr(pub.error || 'saved locally, cloud miss');
        return;
      }
      const urls = shareUrls(result.ids[0]);
      setLink(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'islet failed');
    } finally {
      setBusy(false);
    }
  };

  const onFiles = async (list: FileList | null) => {
    if (!list?.[0]) return;
    const f = list[0];
    setErr('');
    setBusy(true);
    setWarn(f.size > 40 * 1024 * 1024 ? 'chunky file. no hard limit, just might feel slow.' : '');
    try {
      const result = await addFiles([f], 'islet');
      if (!result.ok || !result.ids?.[0]) {
        setErr(result.error || 'could not save');
        return;
      }
      const pub = await togglePublic(result.ids[0]);
      if (!pub.ok) {
        setErr(pub.error || 'saved locally, cloud miss');
        return;
      }
      const urls = shareUrls(result.ids[0]);
      setLink(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'islet failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">islet</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a tiny island for one thing.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            paste a note or drop a single file. it lands in the vault, then the share db, then you get a discord-ready link. not a library. one island.
          </p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="write something small…"
            className="w-full min-h-[140px] rounded-2xl bg-black/35 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-[#0a84ff]/50 transition-colors duration-300"
          />
          <div className="flex flex-wrap gap-3 mt-4">
            <button
              onClick={publishText}
              disabled={busy || !note.trim()}
              className="rounded-full bg-white text-black text-sm px-5 py-2 font-medium disabled:opacity-40 transition-transform duration-200 active:scale-[0.98]"
            >
              {busy ? 'casting…' : 'cast the note'}
            </button>
            <label className="rounded-full border border-white/15 text-sm px-5 py-2 cursor-pointer hover:border-[#0a84ff]/50 transition-colors duration-300">
              or drop one file
              <input type="file" className="hidden" onChange={(e) => onFiles(e.target.files)} />
            </label>
          </div>
          {warn && <p className="text-amber-300/80 text-xs mt-4">{warn}</p>}
          {err && <p className="text-red-400 text-xs mt-4">{err}</p>}
          {link && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 rounded-2xl bg-black/30 p-4">
              <p className="text-[11px] uppercase tracking-wide text-neutral-500 mb-1">discord embed</p>
              <p className="text-sm break-all text-[#0a84ff]">{link}</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
