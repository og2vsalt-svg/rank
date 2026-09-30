import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function hexDump(buf: ArrayBuffer, n = 64) {
  const b = new Uint8Array(buf.slice(0, n));
  return [...b].map((x) => x.toString(16).padStart(2, '0')).join(' ');
}

function guess(buf: ArrayBuffer, name: string, type: string) {
  const b = new Uint8Array(buf.slice(0, 16));
  const s = String.fromCharCode(...b);
  if (s.startsWith('PK')) return 'zip-family (zip / docx / apk)';
  if (b[0] === 0x89 && s.includes('PNG')) return 'png';
  if (b[0] === 0xff && b[1] === 0xd8) return 'jpeg';
  if (s.startsWith('GIF8')) return 'gif';
  if (s.startsWith('%PDF')) return 'pdf';
  if (s.startsWith('ID3') || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0)) return 'audio mpeg';
  if (s.includes('ftyp')) return 'mp4 / mov family';
  if (s.startsWith('RIFF')) return 'riff (wav / avi / webp)';
  if (type) return type;
  return name.split('.').pop() || 'unknown';
}

export default function PrismPage() {
  const [info, setInfo] = useState<{ name: string; size: number; type: string; hex: string; kind: string } | null>(null);
  const [warn, setWarn] = useState('');

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 40 * 1024 * 1024) setWarn('large file. only the first bytes are read, but the picker may hitch.');
    else setWarn('');
    const buf = await file.slice(0, 256).arrayBuffer();
    setInfo({
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream',
      hex: hexDump(buf),
      kind: guess(buf, file.name, file.type),
    });
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">prism</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">peek at a file without hosting it.</h1>
          <p className="text-sm text-neutral-500 mb-6">reads magic bytes in the tab. nothing leaves the machine.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition">
            <input type="file" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            <span className="text-sm text-neutral-300">drop or pick a file</span>
          </label>
          {warn && <p className="text-amber-300/80 text-xs mt-4">{warn}</p>}
          {info && (
            <div className="mt-6 space-y-2 text-sm">
              <p className="text-white font-medium">{info.name}</p>
              <p className="text-neutral-400">{info.kind} · {info.type} · {info.size.toLocaleString()} bytes</p>
              <pre className="mt-3 text-[12px] leading-relaxed text-neutral-300 whitespace-pre-wrap break-all">{info.hex}</pre>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
