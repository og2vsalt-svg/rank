import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('could not read file'));
    r.readAsDataURL(file);
  });
}

export default function NimbusPage() {
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [rows, setRows] = useState<{ name: string; id: string; embed: string; app: string }[]>([]);
  const [err, setErr] = useState('');
  const [lock, setLock] = useState('');

  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    setBusy(true);
    setErr('');
    setWarn('');
    const next: { name: string; id: string; embed: string; app: string }[] = [];
    try {
      for (const file of [...list]) {
        if (file.size > 40 * 1024 * 1024) {
          setWarn('chunky file in the pile. encoding might feel slow. no hard cap.');
        }
        const dataUrl = await readFile(file);
        const id = uid();
        const pub = await publishShare({
          id,
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl,
          lockPass: lock || undefined,
        });
        if (!pub.ok) {
          setErr(pub.error || 'cloud publish failed');
          continue;
        }
        if (pub.warn) setWarn(pub.warn);
        const urls = shareUrls(pub.id || id);
        next.push({ name: file.name, id: pub.id || id, embed: urls.embed, app: urls.app });
      }
      setRows((prev) => [...next, ...prev]);
    } catch (e: any) {
      setErr(e?.message || 'nimbus drop failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">nimbus</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">straight to the cloud db.</h1>
          <p className="text-neutral-400 text-sm mb-6">skips the vault. local file → supabase public_shares. discord embed url comes free.</p>
          <input value={lock} onChange={(e) => setLock(e.target.value)} placeholder="optional passcode" className="w-full mb-4 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none" />
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition-all duration-300">
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'uploading…' : 'drop files here'}</p>
            <p className="text-xs text-neutral-500 mt-2">no file cap. just a slowness heads-up if it is huge.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          <div className="mt-6 space-y-3">
            {rows.map((r) => (
              <div key={r.id} className="rounded-2xl bg-white/[0.04] border border-white/8 px-4 py-3">
                <p className="text-sm text-white truncate">{r.name}</p>
                <p className="text-[11px] text-neutral-500 break-all mt-1">{r.embed}</p>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => navigator.clipboard.writeText(r.embed)} className="text-[12px] px-3 py-1.5 rounded-full bg-white text-black">copy discord link</button>
                  <a href={r.app} className="text-[12px] px-3 py-1.5 rounded-full bg-white/8">open</a>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
