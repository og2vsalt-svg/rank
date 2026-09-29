import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(2) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

async function sha256(buf: ArrayBuffer) {
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function FathomPage() {
  const [info, setInfo] = useState<{
    name: string;
    type: string;
    size: number;
    last: string;
    hash?: string;
    warn?: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  const onFile = async (file: File) => {
    setBusy(true);
    const warn =
      file.size > 40 * 1024 * 1024
        ? 'large file. hashing may feel slow. no hard cap.'
        : file.size > 8 * 1024 * 1024
          ? 'chunky file. give the tab a second.'
          : undefined;
    let hash: string | undefined;
    try {
      hash = await sha256(await file.arrayBuffer());
    } catch {
      hash = undefined;
    }
    setInfo({
      name: file.name,
      type: file.type || 'unknown',
      size: file.size,
      last: file.lastModified ? new Date(file.lastModified).toISOString() : '',
      hash,
      warn,
    });
    setBusy(false);
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
          <p className="text-[#0a84ff] text-sm mb-2">fathom</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">sound a local file. keep the bytes here.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            inspect name, type, size, and sha-256. nothing is uploaded. no size limit, only a slowness note.
          </p>
          <label className="block rounded-[24px] border border-dashed border-white/15 bg-black/20 px-6 py-10 text-center cursor-pointer hover:border-[#0a84ff]/40 transition">
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile(f);
              }}
            />
            <span className="text-sm text-neutral-300">{busy ? 'sounding…' : 'drop or choose a file'}</span>
          </label>
          {info && (
            <div className="mt-6 space-y-2 text-sm text-neutral-300">
              <p><span className="text-neutral-500">name</span> {info.name}</p>
              <p><span className="text-neutral-500">type</span> {info.type}</p>
              <p><span className="text-neutral-500">size</span> {pretty(info.size)}</p>
              {info.last && <p><span className="text-neutral-500">modified</span> {info.last}</p>}
              {info.hash && (
                <p className="break-all"><span className="text-neutral-500">sha-256</span> {info.hash}</p>
              )}
              {info.warn && <p className="text-amber-400/80 text-xs pt-2">{info.warn}</p>}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
