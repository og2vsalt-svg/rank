import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

async function digest(file: File, algo: 'SHA-256' | 'SHA-1' | 'SHA-512') {
  const buf = await file.arrayBuffer();
  const hash = await crypto.subtle.digest(algo, buf);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function HashPage() {
  const [name, setName] = useState('');
  const [out, setOut] = useState<{ sha256: string; sha1: string; sha512: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');

  const onFile = async (file?: File) => {
    if (!file) return;
    setName(file.name);
    setBusy(true);
    setWarn(file.size > 60 * 1024 * 1024 ? 'big file — hashing stays in this tab and might take a second.' : '');
    try {
      const [sha256, sha1, sha512] = await Promise.all([digest(file, 'SHA-256'), digest(file, 'SHA-1'), digest(file, 'SHA-512')]);
      setOut({ sha256, sha1, sha512 });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">hash desk</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">fingerprint a file, stay local.</h1>
          <p className="text-neutral-400 text-sm mb-6">not the vault. just sha-1 / 256 / 512 so you can check a dump before you share it.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center">
            <input type="file" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            <p className="text-white font-medium">{busy ? 'hashing…' : 'drop a file'}</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {out && (
            <div className="mt-6 space-y-3 text-xs break-all text-neutral-300">
              <p className="text-sm text-white">{name}</p>
              <p><span className="text-neutral-500">sha-1</span><br />{out.sha1}</p>
              <p><span className="text-neutral-500">sha-256</span><br />{out.sha256}</p>
              <p><span className="text-neutral-500">sha-512</span><br />{out.sha512}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
