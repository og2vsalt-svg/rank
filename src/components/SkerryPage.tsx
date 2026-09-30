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

export default function SkerryPage() {
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [hours, setHours] = useState(48);
  const [author, setAuthor] = useState('');
  const [link, setLink] = useState('');
  const [embed, setEmbed] = useState('');

  const onFile = async (list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    setErr('');
    setLink('');
    setEmbed('');
    setWarn(f.size > 20 * 1024 * 1024 ? 'isolated drop is large. encoding may feel slow. no hard cap.' : '');
    setBusy(true);
    try {
      const dataUrl = await readAsDataUrl(f);
      const id = uid();
      const expiresAt = new Date(Date.now() + Math.max(1, hours) * 3600 * 1000).toISOString();
      const pub = await publishShare({
        id,
        name: f.name,
        type: f.type || 'application/octet-stream',
        size: f.size,
        dataUrl,
        expiresAt,
        author: author.trim() || undefined,
      });
      if (!pub.ok) {
        setErr(pub.error || 'skerry could not publish');
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
      setErr(e?.message || 'skerry failed');
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
          <p className="text-[#0a84ff] text-sm mb-2">skerry</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">an island drop that fades on its own.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            not a vault. one local file becomes a public share with a timed shoreline. discord unfurls the /s card.
          </p>
          <label className="text-xs text-neutral-500 block mb-1">hours until the tide takes it</label>
          <input
            type="number"
            min={1}
            max={720}
            value={hours}
            onChange={(e) => setHours(Number(e.target.value) || 1)}
            className="w-full mb-4 rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/50"
          />
          <label className="text-xs text-neutral-500 block mb-1">optional mark on the card</label>
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="who left this"
            className="w-full mb-5 rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/50"
          />
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 bg-white/[0.03] px-6 py-10 text-center hover:bg-white/[0.05]">
            <input type="file" className="hidden" onChange={(e) => onFile(e.target.files)} />
            <span className="text-sm text-neutral-300">{busy ? 'rowing out…' : 'place a file on the skerry'}</span>
            <p className="text-xs text-neutral-500 mt-2">no file limit. just a slowness ping if it is huge.</p>
          </label>
          {warn && <p className="mt-4 text-amber-300/90 text-sm">{warn}</p>}
          {err && <p className="mt-4 text-rose-300 text-sm break-all">{err}</p>}
          {embed && (
            <div className="mt-5 text-xs text-neutral-400 space-y-1 break-all">
              <p>discord embed (copied): {embed}</p>
              <p>app: {link}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
