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

async function sha256(buf: ArrayBuffer) {
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export default function GullyPage() {
  const { navigate } = useRouter();
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [digest, setDigest] = useState('');
  const [embed, setEmbed] = useState('');
  const [id, setId] = useState('');
  const [name, setName] = useState('');

  const onFile = async (list: FileList | null) => {
    const file = list?.[0];
    if (!file) return;
    setBusy(true);
    setErr('');
    setWarn(file.size > 40 * 1024 * 1024 ? 'heavy file. hashing and upload can lag this tab. no hard cap.' : '');
    try {
      const buf = await file.arrayBuffer();
      const hex = await sha256(buf);
      setDigest(hex);
      setName(file.name);
      const dataUrl = await readFile(file);
      const nid = 'gully-' + Date.now().toString(36);
      const res = await publishShare({
        id: nid,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
      });
      if (!res.ok) {
        setErr(res.error || 'cloud publish failed');
        return;
      }
      if (res.warn) setWarn(res.warn);
      setId(res.id || nid);
      setEmbed(shareUrls(res.id || nid).embed);
    } catch (e: any) {
      setErr(e?.message || 'drop failed');
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
          <p className="text-[#0a84ff] text-sm mb-2">gully</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">hash, then host.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            fingerprint a local file with sha-256, push it to the share db, and hand out a discord-ready /s/ link. not the vault.
          </p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition">
            <input type="file" className="hidden" onChange={(e) => onFile(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'hashing + publishing…' : 'pick a local file'}</p>
            <p className="text-xs text-neutral-500 mt-2">no file limit. just a slowness ping if it is huge.</p>
          </label>
          {digest && (
            <div className="mt-5 rounded-2xl bg-black/30 p-4">
              <p className="text-[11px] text-neutral-500 mb-1">sha-256 · {name}</p>
              <p className="text-xs break-all font-mono text-neutral-300">{digest}</p>
            </div>
          )}
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {id && (
            <div className="mt-6 space-y-3">
              <p className="text-xs text-neutral-500">discord embed</p>
              <p className="text-sm break-all text-white">{embed}</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => navigator.clipboard.writeText(embed)} className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium">copy embed</button>
                <button onClick={() => navigate('share', id)} className="px-4 py-2 rounded-full bg-white/10 text-sm">open drop</button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
