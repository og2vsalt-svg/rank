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

export default function OrielPage() {
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const pick = async (list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    setFile(f);
    setErr('');
    setEmbed('');
    setWarn(f.size > 12 * 1024 * 1024 ? 'large still. encoding may feel slow. no hard cap.' : '');
    if (f.type.startsWith('image/')) {
      setPreview(await readAsDataUrl(f));
    } else {
      setPreview('');
    }
  };

  const publish = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const dataUrl = preview && file.type.startsWith('image/') ? preview : await readAsDataUrl(file);
      const id = uid();
      const pub = await publishShare({
        id,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
        author: 'oriel',
      });
      if (!pub.ok) {
        setErr(pub.error || 'could not publish');
        return;
      }
      if (pub.warn) setWarn(pub.warn);
      const urls = shareUrls(id);
      setEmbed(urls.embed);
      try {
        await navigator.clipboard.writeText(urls.embed);
      } catch {}
    } catch (e: any) {
      setErr(e?.message || 'oriel failed');
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
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">oriel</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a window first, then the share.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            look at a local still before it leaves the tab. publish writes the file into the share table and copies the discord card.
          </p>
          <label className="block cursor-pointer rounded-[24px] overflow-hidden border border-white/10 hover:border-[#0a84ff]/40 transition">
            <input type="file" className="hidden" accept="*/*" onChange={(e) => pick(e.target.files)} />
            {preview ? (
              <img src={preview} alt="" className="w-full max-h-80 object-cover" />
            ) : (
              <div className="px-6 py-16 text-center">
                <p className="text-white font-medium">{file ? file.name : 'choose a local file'}</p>
                <p className="text-xs text-neutral-500 mt-2">images get a window. everything else still ships.</p>
              </div>
            )}
          </label>
          <div className="mt-5 flex gap-2">
            <button
              onClick={publish}
              disabled={!file || busy}
              className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40"
            >
              {busy ? 'publishing…' : 'publish window'}
            </button>
          </div>
          {warn && <p className="text-amber-300/90 text-xs mt-3">{warn}</p>}
          {err && <p className="text-red-400 text-xs mt-3">{err}</p>}
          {embed && <p className="text-xs text-neutral-400 mt-4 break-all">discord card copied: {embed}</p>}
        </motion.div>
      </div>
    </div>
  );
}
