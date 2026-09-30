import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('could not read file'));
    r.readAsDataURL(file);
  });
}

export default function ReliquaryPage() {
  const [busy, setBusy] = useState(false);
  const [caption, setCaption] = useState('');
  const [hours, setHours] = useState('');
  const [pass, setPass] = useState('');
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [embed, setEmbed] = useState('');
  const [name, setName] = useState('');

  const onFile = async (list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    setErr('');
    setLink('');
    setEmbed('');
    setName(f.name);
    setWarn(f.size > 16 * 1024 * 1024 ? 'large relic. encoding may feel slow. no hard cap.' : '');
    setBusy(true);
    try {
      const dataUrl = await readAsDataUrl(f);
      const id = uid();
      const expiresAt = hours
        ? new Date(Date.now() + Number(hours) * 3600 * 1000).toISOString()
        : null;
      const labeled = caption.trim() ? `${caption.trim()} — ${f.name}` : f.name;
      const pub = await publishShare({
        id,
        name: labeled.slice(0, 180),
        type: f.type || 'application/octet-stream',
        size: f.size,
        dataUrl,
        lockPass: pass || undefined,
        expiresAt,
        author: caption.trim() || undefined,
      });
      if (!pub.ok) {
        setErr(pub.error || 'could not publish');
        return;
      }
      if (pub.warn) setWarn(pub.warn);
      const urls = shareUrls(id);
      setLink(urls.app);
      setEmbed(urls.embed);
      try {
        await navigator.clipboard.writeText(urls.embed);
      } catch {}
    } catch (e: any) {
      setErr(e?.message || 'reliquary failed');
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
          <p className="text-[#0a84ff] text-sm mb-2">reliquary</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">label a file, then lay it in the share db.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            a caption becomes the discord card title. optional pass and tide. no size cap — only a slowness note.
          </p>
          <div className="space-y-3 mb-5">
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="caption for the card"
              className="w-full px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none focus:border-[#0a84ff]/40"
            />
            <div className="flex gap-2">
              <input
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="hours until it fades"
                inputMode="numeric"
                className="flex-1 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none"
              />
              <input
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder="optional pass"
                className="flex-1 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none"
              />
            </div>
          </div>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition">
            <input type="file" className="hidden" onChange={(e) => onFile(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'laying it down…' : name ? `swap ${name}` : 'drop a relic'}</p>
            <p className="text-xs text-neutral-500 mt-2">the embed link copies itself.</p>
          </label>
          {warn && <p className="text-amber-300/90 text-xs mt-3">{warn}</p>}
          {err && <p className="text-red-400 text-xs mt-3">{err}</p>}
          {link && (
            <div className="mt-6 space-y-2 text-xs text-neutral-400 break-all">
              <p>app: {link}</p>
              <p>discord embed (copied): {embed}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
