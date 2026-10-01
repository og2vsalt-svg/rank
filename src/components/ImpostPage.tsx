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
    r.onerror = () => reject(new Error('could not read'));
    r.readAsDataURL(file);
  });
}

export default function ImpostPage() {
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [preview, setPreview] = useState('');
  const [embed, setEmbed] = useState('');

  const run = async (file: File) => {
    setErr('');
    setEmbed('');
    setWarn(file.size > 20 * 1024 * 1024 ? 'heavy stone. encoding may hitch. no hard cap.' : '');
    setBusy(true);
    try {
      const dataUrl = await readAsDataUrl(file);
      setPreview(file.type.startsWith('image/') ? dataUrl : '');
      const id = uid();
      const res = await publishShare({
        id,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
        author: 'impost',
      });
      if (!res.ok) throw new Error(res.error || 'could not seat the file');
      const urls = shareUrls(res.id || id);
      setEmbed(urls.embed);
      if (res.warn) setWarn(res.warn);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'failed');
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
          <p className="text-[#0a84ff] text-sm font-medium mb-2 tracking-wide">impost</p>
          <h1 className="text-3xl font-semibold text-white tracking-tight mb-2">seat one file on the springing</h1>
          <p className="text-neutral-400 text-sm mb-6">uploads a local into the share db. discord cards on /s. slowness warning only.</p>
          <label className="block cursor-pointer rounded-2xl border border-dashed border-white/15 px-5 py-10 text-center text-neutral-400 text-sm hover:border-[#0a84ff]/40 transition">
            {busy ? 'seating…' : 'drop a file or click to choose'}
            <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && run(e.target.files[0])} />
          </label>
          {warn && <p className="text-amber-300/80 text-xs mt-3">{warn}</p>}
          {preview && <img src={preview} alt="" className="mt-5 rounded-2xl max-h-64 object-contain mx-auto" />}
          {err && <p className="text-red-400 text-sm mt-4">{err}</p>}
          {embed && <p className="text-sm text-[#0a84ff] mt-4 break-all">{embed}</p>}
          <p className="text-xs text-neutral-500 mt-4">no file limit. just a slowness ping if it is huge.</p>
        </motion.div>
      </div>
    </div>
  );
}
