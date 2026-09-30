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

export default function LanternPage() {
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState('');
  const [kind, setKind] = useState('');
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
    setKind(f.type || '');
    setWarn(f.size > 20 * 1024 * 1024 ? 'bright file. preview and upload may feel slow. no hard cap.' : '');
    setBusy(true);
    try {
      const dataUrl = await readAsDataUrl(f);
      setPreview(dataUrl);
      const id = uid();
      const pub = await publishShare({
        id,
        name: f.name,
        type: f.type || 'application/octet-stream',
        size: f.size,
        dataUrl,
        author: 'lantern',
      });
      if (!pub.ok) {
        setErr(pub.error || 'could not light it');
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
      setErr(e?.message || 'lantern failed');
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
          <p className="text-[#0a84ff] text-sm mb-2">lantern</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">preview a still, then hang it on the share db.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            images and clips glow here first. discord unfurls the same file from /s. no size cap — only a slowness note.
          </p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition">
            <input type="file" accept="image/*,video/*" className="hidden" onChange={(e) => onFile(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'hanging the lamp…' : name ? `swap ${name}` : 'choose a still or clip'}</p>
            <p className="text-xs text-neutral-500 mt-2">the embed link copies itself.</p>
          </label>
          {preview && kind.startsWith('image/') && (
            <img src={preview} alt="" className="mt-5 w-full rounded-[24px] object-cover max-h-80" />
          )}
          {preview && kind.startsWith('video/') && (
            <video src={preview} controls className="mt-5 w-full rounded-[24px] max-h-80" />
          )}
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
