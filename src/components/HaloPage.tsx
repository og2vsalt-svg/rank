import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { shareUrls } from '../lib/cloudShare';

function hueFromName(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i) * 17) % 360;
  return h;
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('could not read file'));
    r.readAsDataURL(file);
  });
}

export default function HaloPage() {
  const [file, setFile] = useState<File | null>(null);
  const [hue, setHue] = useState(210);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');
  const [embed, setEmbed] = useState('');
  const [link, setLink] = useState('');

  const pick = (f?: File) => {
    if (!f) return;
    setFile(f);
    setHue(hueFromName(f.name + f.size));
    setWarn(f.size > 40 * 1024 * 1024 ? 'no limit, just a heads up this encode can drag.' : '');
    setEmbed('');
    setErr('');
  };

  const send = async () => {
    if (!file) return;
    setBusy(true);
    setErr('');
    try {
      const dataUrl = await readAsDataUrl(file);
      const r = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl,
          author: `halo ${hue}`,
        }),
      });
      const json = await r.json();
      if (!r.ok || !json?.ok) throw new Error(json?.error || 'halo failed');
      const urls = shareUrls(json.id);
      setLink(urls.app);
      setEmbed(urls.embed || `${window.location.origin}/s/${json.id}`);
      try { await navigator.clipboard.writeText(urls.embed || urls.app); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'halo failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8 overflow-hidden relative"
        >
          <div
            className="absolute -top-24 -right-16 w-64 h-64 rounded-full blur-3xl opacity-40 pointer-events-none"
            style={{ background: `hsl(${hue} 90% 55%)` }}
          />
          <p className="text-[#0a84ff] text-sm mb-2 relative">halo</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3 relative">give a file a color before it leaves.</h1>
          <p className="text-neutral-400 text-sm mb-6 relative">pure vibe tool. hue is derived from the name so discord unfurls still look intentional.</p>
          <label className="relative block cursor-pointer rounded-[24px] border border-dashed border-white/15 p-10 text-center">
            <input type="file" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
            <p className="text-white font-medium">{file ? file.name : 'pick a file'}</p>
          </label>
          {file && (
            <div className="relative mt-6">
              <input type="range" min={0} max={359} value={hue} onChange={(e) => setHue(Number(e.target.value))} className="w-full" />
              <button
                onClick={send}
                disabled={busy}
                className="mt-4 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50"
              >
                {busy ? 'glowing…' : 'share with halo'}
              </button>
            </div>
          )}
          {warn && <p className="text-xs text-amber-300/80 mt-3 relative">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3 relative">{err}</p>}
          {embed && (
            <div className="mt-6 space-y-2 relative">
              <p className="text-xs text-neutral-400 break-all">discord: {embed}</p>
              <p className="text-xs text-neutral-500 break-all">app: {link}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
