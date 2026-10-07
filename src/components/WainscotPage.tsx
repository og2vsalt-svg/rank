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

export default function WainscotPage() {
  const [label, setLabel] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');

  const onFile = async (list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    setErr('');
    setEmbed('');
    setWarn(f.size > 12 * 1024 * 1024 ? 'large drop. encoding may feel slow. no hard cap.' : '');
    setBusy(true);
    try {
      const dataUrl = await readAsDataUrl(f);
      const id = uid();
      const name = label.trim() ? `${label.trim()} — ${f.name}` : f.name;
      const pub = await publishShare({
        id,
        name,
        type: f.type || 'application/octet-stream',
        size: f.size,
        dataUrl,
        author: label.trim() || undefined,
      });
      if (!pub.ok) {
        setErr(pub.error || 'could not publish');
        return;
      }
      if (pub.warn) setWarn(pub.warn);
      setEmbed(shareUrls(id).embed);
      try {
        await navigator.clipboard.writeText(shareUrls(id).embed);
      } catch {}
    } catch (e: any) {
      setErr(e?.message || 'wainscot failed');
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
          <p className="text-[#0a84ff] text-sm mb-2">wainscot</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">panel a local file with a provenance line.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            the label rides on the public drop. discord unfurls the /s card.
          </p>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="who filed this, or why"
            className="w-full mb-4 rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-[#0a84ff]/40"
          />
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition">
            <input type="file" className="hidden" onChange={(e) => onFile(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'publishing…' : 'choose a local file'}</p>
            <p className="text-xs text-neutral-500 mt-2">no file limit. only a slowness ping.</p>
          </label>
          {warn && <p className="text-amber-300/90 text-xs mt-3">{warn}</p>}
          {err && <p className="text-red-400 text-xs mt-3">{err}</p>}
          {embed && <p className="text-xs text-neutral-400 break-all mt-4">discord embed (copied): {embed}</p>}
        </motion.div>
      </div>
    </div>
  );
}
