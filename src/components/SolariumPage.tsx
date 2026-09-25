import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('could not read file'));
    reader.readAsDataURL(file);
  });
}

export default function SolariumPage() {
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [caption, setCaption] = useState('');
  const [name, setName] = useState('');
  const [embed, setEmbed] = useState('');
  const [app, setApp] = useState('');

  const send = async (file: File | null) => {
    if (!file) return;
    setErr('');
    setEmbed('');
    setApp('');
    const chunky = file.size > 40 * 1024 * 1024;
    setWarn(chunky ? 'this file is heavy. the tab might feel sleepy while it encodes. no cap tho.' : '');
    setBusy(true);
    try {
      const dataUrl = await readFile(file);
      const id = uid();
      const published = await publishShare({
        id,
        name: file.name || name || 'solarium-drop',
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
        author: caption.trim() || undefined,
      });
      if (!published.ok) {
        setErr(published.error || 'could not reach the share db');
        return;
      }
      if (published.warn) setWarn(published.warn);
      const urls = shareUrls(published.id || id);
      setEmbed(urls.embed);
      setApp(urls.app);
      try {
        await navigator.clipboard.writeText(urls.embed);
      } catch {}
    } catch (e: any) {
      setErr(e?.message || 'solarium failed');
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
          <p className="text-[#0a84ff] text-sm mb-2">solarium</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">sun desk for one file.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            not a vault grid. pick a local file, write a short caption, publish it to the share db. discord gets a /s card.
          </p>
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value.slice(0, 80))}
            placeholder="optional caption for the embed"
            className="w-full mb-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-[#0a84ff]/50 transition"
          />
          <input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 120))}
            placeholder="rename on the way out (optional)"
            className="w-full mb-5 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-[#0a84ff]/50 transition"
          />
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              send(e.dataTransfer.files?.[0] || null);
            }}
          >
            <input
              type="file"
              className="hidden"
              onChange={(e) => send(e.target.files?.[0] || null)}
            />
            <p className="text-white font-medium">{busy ? 'warming the glass…' : 'drop one local file'}</p>
            <p className="text-xs text-neutral-500 mt-2">no hard limit. we only warn if it might slow the tab.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {embed && (
            <div className="mt-6 space-y-2">
              <p className="text-xs text-neutral-400 break-all">discord embed (copied): {embed}</p>
              <p className="text-xs text-neutral-500 break-all">app link: {app}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
