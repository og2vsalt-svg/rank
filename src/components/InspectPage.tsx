import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function hex(buf: ArrayBuffer, n = 32) {
  return [...new Uint8Array(buf).slice(0, n)].map((b) => b.toString(16).padStart(2, '0')).join(' ');
}

function sniff(bytes: Uint8Array) {
  const s = [...bytes.slice(0, 12)].map((b) => b.toString(16).padStart(2, '0')).join('');
  if (s.startsWith('89504e47')) return 'png';
  if (s.startsWith('ffd8ff')) return 'jpeg';
  if (s.startsWith('47494638')) return 'gif';
  if (s.startsWith('25504446')) return 'pdf';
  if (s.startsWith('504b0304')) return 'zip/office';
  if (s.startsWith('1f8b08')) return 'gzip';
  if (s.startsWith('52494646') && s.includes('57415645')) return 'wav';
  if (s.startsWith('000000') && s.includes('66747970')) return 'mp4/mov';
  return 'unknown';
}

export default function InspectPage() {
  const [info, setInfo] = useState<null | {
    name: string; size: number; type: string; lastModified: number; magic: string; sniff: string; hex: string;
  }>(null);
  const [warn, setWarn] = useState('');

  const onFile = async (f: File) => {
    setWarn(f.size > 80 * 1024 * 1024 ? 'this is a big file. inspect still works, just might feel sticky for a sec.' : '');
    const buf = await f.slice(0, 64).arrayBuffer();
    const bytes = new Uint8Array(buf);
    setInfo({
      name: f.name,
      size: f.size,
      type: f.type || 'unknown',
      lastModified: f.lastModified,
      magic: sniff(bytes),
      sniff: sniff(bytes),
      hex: hex(buf),
    });
  };

  return (
    <div className="min-h-screen mesh">
      <Navbar />
      <main className="max-w-2xl mx-auto px-5 pt-28 pb-20">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0a84ff] text-sm mb-2">inspect</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">peek at a file</h1>
          <p className="text-neutral-500 text-sm mb-8">no upload. stays on this machine. magic bytes, size, mime.</p>
          <label className="glass block rounded-3xl p-10 text-center cursor-pointer">
            <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
            <span className="text-sm text-neutral-300">drop or pick a file</span>
          </label>
          {warn && <p className="text-xs text-amber-400/80 mt-3">{warn}</p>}
          {info && (
            <div className="mt-8 glass rounded-3xl p-6 space-y-2 text-sm">
              <p><span className="text-neutral-500">name</span> {info.name}</p>
              <p><span className="text-neutral-500">size</span> {info.size.toLocaleString()} bytes</p>
              <p><span className="text-neutral-500">mime</span> {info.type}</p>
              <p><span className="text-neutral-500">magic</span> {info.magic}</p>
              <p><span className="text-neutral-500">modified</span> {new Date(info.lastModified).toLocaleString()}</p>
              <p className="font-mono text-xs text-neutral-400 break-all"><span className="text-neutral-500">hex </span>{info.hex}</p>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
