import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('could not read file'));
    reader.readAsDataURL(file);
  });
}

export default function PierPage() {
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [note, setNote] = useState('');
  const [result, setResult] = useState<{ id: string; embed: string; app: string; name: string } | null>(null);

  const onFiles = async (list: FileList | null) => {
    const file = list?.[0];
    if (!file) return;
    setErr('');
    setResult(null);
    setWarn(file.size > 40 * 1024 * 1024 ? 'chunky file. the tab might feel sleepy while it encodes. no cap tho.' : '');
    setBusy(true);
    try {
      const dataUrl = await readAsDataUrl(file);
      const id = uid();
      const pub = await publishShare({
        id,
        name: file.name || 'drop',
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
        author: note.trim() || undefined,
      });
      if (!pub.ok) {
        setErr(pub.error || 'could not land this on the pier');
        return;
      }
      if (pub.warn) setWarn(pub.warn);
      const urls = shareUrls(id);
      setResult({ id, embed: urls.embed, app: urls.app, name: file.name });
      try {
        await navigator.clipboard.writeText(urls.embed);
      } catch {}
    } catch (e: any) {
      setErr(e?.message || 'pier miss');
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
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">pier</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">ship a file off the dock.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            picks a local file, writes it to the share db, hands you a discord-ready /s card. not another vault grid.
          </p>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="optional signer name"
            className="w-full mb-4 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-[#0a84ff]/40 transition"
          />
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              onFiles(e.dataTransfer.files);
            }}
          >
            <input type="file" className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'tying the line…' : 'drop one file on the pier'}</p>
            <p className="text-xs text-neutral-500 mt-2">no hard limit. just a slowness warning if it is huge.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 space-y-2"
            >
              <p className="text-sm text-white">{result.name} is live</p>
              <p className="text-xs text-neutral-400 break-all">discord embed (copied): {result.embed}</p>
              <p className="text-xs text-neutral-500 break-all">app link: {result.app}</p>
              <a
                href={result.embed}
                className="inline-flex mt-2 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium"
              >
                open embed card
              </a>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
