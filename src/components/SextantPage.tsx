import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

async function sha256(file: File) {
  const buf = await file.arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function imageSize(file: File) {
  return new Promise<{ w: number; h: number } | null>((resolve) => {
    if (!file.type.startsWith('image/')) return resolve(null);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ w: img.naturalWidth, h: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

export default function SextantPage() {
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [report, setReport] = useState<string>('');

  const inspect = async (file?: File) => {
    if (!file) return;
    setErr('');
    setReport('');
    setWarn(file.size > 40 * 1024 * 1024 ? 'no cap. hashing a large file can make the tab feel sleepy.' : '');
    setBusy(true);
    try {
      const [digest, dims] = await Promise.all([sha256(file), imageSize(file)]);
      const lines = [
        file.name,
        file.type || 'application/octet-stream',
        pretty(file.size),
        file.lastModified ? new Date(file.lastModified).toISOString() : 'unknown date',
        dims ? `${dims.w} × ${dims.h}` : 'no pixel frame',
        digest,
      ];
      setReport(lines.join('\n'));
    } catch (e: any) {
      setErr(e?.message || 'sextant failed');
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
          <p className="text-[#0a84ff] text-sm mb-2">sextant</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">take a bearing on a local file.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            stays on this machine. name, type, size, date, pixels if any, sha-256. nothing is uploaded.
          </p>
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); inspect(e.dataTransfer.files?.[0]); }}
          >
            <input type="file" className="hidden" onChange={(e) => inspect(e.target.files?.[0] || undefined)} />
            <p className="text-white font-medium">{busy ? 'sighting…' : 'drop one file'}</p>
            <p className="text-xs text-neutral-500 mt-2">no hard limit. we only warn when hashing might feel slow.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {report && (
            <pre className="mt-6 text-xs text-neutral-300 whitespace-pre-wrap break-all leading-6">{report}</pre>
          )}
        </motion.div>
      </div>
    </div>
  );
}
