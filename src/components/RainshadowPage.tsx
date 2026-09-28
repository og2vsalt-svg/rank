import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

export default function RainshadowPage() {
  const [hours, setHours] = useState(24);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [until, setUntil] = useState('');

  const onFile = async (list: FileList | null) => {
    const file = list?.[0];
    if (!file) return;
    setErr('');
    setWarn(file.size > 40 * 1024 * 1024 ? 'large drop. encoding may feel slow. expiry still applies.' : '');
    setBusy(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ''));
        r.onerror = () => reject(r.error);
        r.readAsDataURL(file);
      });
      const expiresAt = new Date(Date.now() + hours * 3600 * 1000).toISOString();
      const id = 'rs-' + Date.now().toString(36);
      const res = await publishShare({
        id,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
        expiresAt,
      });
      if (!res.ok) { setErr(res.error || 'failed'); return; }
      setUntil(new Date(expiresAt).toLocaleString());
      const urls = shareUrls(res.id || id);
      setLink(urls.embed);
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
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">rainshadow</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a drop that dries out on its own.</h1>
          <p className="text-neutral-400 text-sm mb-6">pick how many hours the public record should live. after that the share db treats it as gone.</p>
          <div className="flex items-center gap-3 mb-5">
            <input type="range" min={1} max={168} value={hours} onChange={(e) => setHours(Number(e.target.value))} className="flex-1" />
            <span className="text-sm text-neutral-300 w-20 text-right">{hours}h</span>
          </div>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 p-10 text-center">
            <input type="file" className="hidden" onChange={(e) => onFile(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'publishing…' : 'drop a file with an expiry'}</p>
            <p className="text-xs text-neutral-500 mt-2">no size cap. just a slowness warning.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {link && (
            <div className="mt-5 text-xs text-neutral-400">
              <p>live until {until}</p>
              <p className="break-all mt-1">{link}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
