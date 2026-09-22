import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { publishShare, shareUrls } from '../lib/cloudShare';

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('could not read file'));
    r.readAsDataURL(file);
  });
}

function nid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function formatBytes(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  return (n / (1024 * 1024)).toFixed(2) + ' mb';
}

export default function DunePage() {
  const { navigate } = useRouter();
  const [busy, setBusy] = useState(false);
  const [pass, setPass] = useState('');
  const [note, setNote] = useState('');
  const [hint, setHint] = useState('');
  const [embed, setEmbed] = useState('');
  const [name, setName] = useState('');
  const [size, setSize] = useState(0);
  const [err, setErr] = useState('');

  const onFile = async (list: FileList | null) => {
    const file = list?.[0];
    if (!file) return;
    setErr('');
    setHint(file.size > 40 * 1024 * 1024 ? 'big file. browsers get sleepy encoding this. no cap though.' : '');
    setBusy(true);
    setName(file.name);
    setSize(file.size);
    try {
      const dataUrl = await readFile(file);
      const idv = nid();
      const res = await publishShare({
        id: idv,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
        lockPass: pass || undefined,
        author: note || undefined,
      });
      if (!res.ok) throw new Error(res.error || 'share failed');
      setEmbed(shareUrls(res.id || idv).embed);
      if (res.warn) setHint(res.warn);
    } catch (e: any) {
      setErr(e?.message || 'upload failed');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">dune</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">one file, public share card.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            local file goes to supabase public_shares. you get a /s/ link that discord actually previews.
          </p>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="optional label"
            className="w-full mb-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#0a84ff]/40"
          />
          <input
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            placeholder="optional lock phrase"
            className="w-full mb-5 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#0a84ff]/40"
          />
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-12 text-center transition">
            <input type="file" className="hidden" onChange={(e) => onFile(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'publishing…' : 'drop a local file'}</p>
            <p className="text-xs text-neutral-500 mt-2">no hard limit. just a slowness warning on chunky dumps.</p>
          </label>
          {hint && <p className="text-xs text-amber-300/80 mt-4">{hint}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {embed && (
            <div className="mt-6 rounded-2xl border border-white/10 p-4">
              <p className="text-sm text-white">{name}</p>
              <p className="text-xs text-neutral-500 mt-1">{formatBytes(size)}</p>
              <p className="text-xs text-neutral-400 mt-3 break-all">{embed}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                <button onClick={() => navigator.clipboard.writeText(embed)} className="px-3 py-1.5 rounded-full bg-white text-black text-xs font-medium">copy discord link</button>
                <button onClick={() => navigate('share', embed.split('/').pop() || '')} className="px-3 py-1.5 rounded-full bg-white/10 text-xs">open drop</button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
