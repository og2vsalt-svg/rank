import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function ScripPage() {
  const [status, setStatus] = useState('');
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);

  const onFile = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setStatus('reading...');
    setWarn('');
    setLink('');
    try {
      if (file.size > 12 * 1024 * 1024) {
        setWarn('this one is chunky. upload still runs, just might feel slow.');
      }
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ''));
        r.onerror = () => reject(new Error('could not read file'));
        r.readAsDataURL(file);
      });
      const id = uid();
      setStatus('publishing to the public table...');
      const res = await publishShare({
        id,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
      });
      if (!res.ok) {
        setStatus(res.error || 'publish failed');
        return;
      }
      if (res.warn) setWarn(res.warn);
      const urls = shareUrls(res.id || id);
      setLink(urls.embed);
      setStatus('live. discord will unfurl the /s/ link.');
    } catch (e: any) {
      setStatus(e?.message || 'failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">scrip</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">drop a local file. get a share.</h1>
          <p className="text-sm text-neutral-400 mb-6">this is the public desk, not the private vault. file goes to supabase (and blob when the api is up). no hard size cap.</p>
          <label className="block rounded-[24px] border border-dashed border-white/15 bg-white/5 px-6 py-10 text-center cursor-pointer hover:bg-white/8">
            <input type="file" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} disabled={busy} />
            <p className="text-sm text-neutral-200">{busy ? 'working...' : 'tap to pick a file'}</p>
            <p className="text-xs text-neutral-500 mt-2">images, zips, dumps, whatever. big ones just warn.</p>
          </label>
          {warn && <p className="text-sm text-amber-300 mt-4">{warn}</p>}
          {status && <p className="text-sm text-neutral-300 mt-3">{status}</p>}
          {link && (
            <div className="mt-5 rounded-2xl bg-white/5 p-4">
              <p className="text-[11px] uppercase tracking-wide text-neutral-500 mb-1">discord link</p>
              <p className="text-sm break-all text-neutral-200">{link}</p>
              <button onClick={() => navigator.clipboard.writeText(link)} className="mt-3 px-4 py-1.5 rounded-full bg-white text-black text-xs font-medium">copy</button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
