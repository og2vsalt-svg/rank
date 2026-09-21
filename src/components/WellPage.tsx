import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function WellPage() {
  const [status, setStatus] = useState('');
  const [link, setLink] = useState('');
  const [warn, setWarn] = useState('');
  const [busy, setBusy] = useState(false);

  async function onFile(f: File | undefined) {
    if (!f) return;
    setBusy(true);
    setStatus('dropping into the well…');
    setWarn('');
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result || '');
      if (f.size > 40 * 1024 * 1024) {
        setWarn('big file. no cap from us, but the tab or host might crawl.');
      }
      const id = uid();
      const res = await publishShare({
        id,
        name: f.name,
        type: f.type || 'application/octet-stream',
        size: f.size,
        dataUrl,
      });
      setBusy(false);
      if (!res.ok) {
        setStatus(res.error || 'could not publish');
        return;
      }
      const urls = shareUrls(res.id || id);
      setLink(urls.embed);
      setStatus('live in the cloud. paste this in discord for a clean embed.');
      if (res.warn) setWarn(res.warn);
    };
    reader.readAsDataURL(f);
  }

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
          <p className="text-[#0a84ff] text-sm mb-2">well</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">drop a file into the public well.</h1>
          <p className="text-neutral-400 text-sm mb-6">uploads a local file to the share db. no hard size lock. we only whisper if it might feel slow.</p>
          <label className="block rounded-[24px] border border-dashed border-white/15 bg-white/[0.03] px-6 py-12 text-center cursor-pointer hover:bg-white/[0.05] transition-colors">
            <input type="file" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            <p className="text-sm text-neutral-300">{busy ? 'uploading…' : 'tap or drop a file'}</p>
          </label>
          {status && <p className="text-sm text-neutral-400 mt-5">{status}</p>}
          {warn && <p className="text-xs text-amber-300/80 mt-2">{warn}</p>}
          {link && (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => navigator.clipboard.writeText(link)}
                className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium"
              >
                copy discord link
              </button>
              <a href={link} className="px-5 py-2.5 rounded-full bg-white/5 text-sm">open embed</a>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
