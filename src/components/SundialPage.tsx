import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { useRouter } from './Router';
import { publishShare, shareUrls } from '../lib/cloudShare';

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('read failed'));
    reader.readAsDataURL(file);
  });
}

export default function SundialPage() {
  const { addFiles } = useVault();
  const { navigate } = useRouter();
  const [hours, setHours] = useState(24);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [id, setId] = useState<string | null>(null);

  const onFiles = async (list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    setWarn(f.size > 40 * 1024 * 1024 ? 'large file. encoding stays in this tab and may drag. no cap.' : '');
    setErr('');
    setBusy(true);
    try {
      const saved = await addFiles(list, 'sundial');
      const sid = saved.ids?.[0] || Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const dataUrl = await fileToDataUrl(f);
      const expiresAt = new Date(Date.now() + Math.max(1, hours) * 3600 * 1000).toISOString();
      const pub = await publishShare({
        id: sid,
        name: f.name,
        type: f.type || 'application/octet-stream',
        size: f.size,
        dataUrl,
        expiresAt,
      });
      if (!pub.ok) {
        setErr(pub.error || 'could not write the public row');
        if (saved.ok) setId(sid);
        return;
      }
      setId(sid);
      const urls = shareUrls(sid);
      setLink(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'sundial failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">sundial</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">public for a while, then it fades.</h1>
          <p className="text-neutral-400 text-sm mb-6">uploads a local file into the share db with an expiry. discord cards still unfurl while it is live.</p>
          <label className="flex items-center justify-between gap-4 mb-4 text-sm text-neutral-300">
            <span>hours live</span>
            <input type="number" min={1} value={hours} onChange={(e) => setHours(Number(e.target.value) || 1)} className="w-24 bg-black/30 border border-white/10 rounded-full px-3 py-2 text-white outline-none" />
          </label>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}>
            <input type="file" className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'casting the shadow…' : 'set a file on the sundial'}</p>
            <p className="text-xs text-neutral-500 mt-2">no size lock. just a slowness note.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {id && !err && (
            <div className="mt-6 space-y-3">
              <p className="text-xs text-neutral-400 break-all">embed (copied): {link}</p>
              <button onClick={() => navigate('share', id)} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">open while it lasts</button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
