import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function WickPage() {
  const { navigate } = useRouter();
  const [hours, setHours] = useState(24);
  const [pass, setPass] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [id, setId] = useState('');

  const onFile = async (list: FileList | null) => {
    const file = list?.[0];
    if (!file) return;
    setBusy(true);
    setErr('');
    setWarn(file.size > 20 * 1024 * 1024 ? 'big wick. the encode step can lag. no cap.' : '');
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('read failed'));
        reader.readAsDataURL(file);
      });
      const nextId = uid();
      const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
      const pub = await publishShare({
        id: nextId,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
        lockPass: pass || undefined,
        expiresAt,
      });
      if (!pub.ok) throw new Error(pub.error || 'publish failed');
      setId(nextId);
      try {
        await navigator.clipboard.writeText(shareUrls(nextId).embed);
      } catch {}
    } catch (e: any) {
      setErr(e?.message || 'wick failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">wick</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">timed public drop.</h1>
          <p className="text-sm text-neutral-500 mb-6">upload a local file, set how long the link stays live, optional pass. embed url is the /s/ one discord likes.</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {[1, 6, 24, 72, 168].map((h) => (
              <button
                key={h}
                onClick={() => setHours(h)}
                className={`px-3.5 py-1.5 rounded-full text-[13px] ${hours === h ? 'bg-white text-black' : 'bg-white/5 text-neutral-300'}`}
              >
                {h < 24 ? h + 'h' : h / 24 + 'd'}
              </button>
            ))}
          </div>
          <input
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            placeholder="optional passcode"
            className="w-full mb-5 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none"
          />
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition">
            <input type="file" className="hidden" onChange={(e) => onFile(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'lighting…' : 'choose a file'}</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {id && (
            <div className="mt-6 space-y-3">
              <p className="text-xs text-neutral-400 break-all">discord embed copied: {shareUrls(id).embed}</p>
              <button onClick={() => navigate('share', id)} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">open drop</button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
