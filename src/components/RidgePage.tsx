import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function parseHeaders(buf: ArrayBuffer) {
  const bytes = new Uint8Array(buf.slice(0, 16));
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join(' ');
  const ascii = [...bytes].map((b) => (b >= 32 && b < 127 ? String.fromCharCode(b) : '.')).join('');
  let kind = 'unknown';
  const s = hex.replace(/ /g, '');
  if (s.startsWith('89504e47')) kind = 'png';
  else if (s.startsWith('ffd8ff')) kind = 'jpeg';
  else if (s.startsWith('47494638')) kind = 'gif';
  else if (s.startsWith('25504446')) kind = 'pdf';
  else if (s.startsWith('504b0304')) kind = 'zip / office';
  else if (s.startsWith('1a45dfa3')) kind = 'webm / mkv';
  else if (s.startsWith('000000') && s.includes('66747970')) kind = 'mp4';
  return { hex, ascii, kind, bytes: bytes.length };
}

export default function RidgePage() {
  const [name, setName] = useState('');
  const [size, setSize] = useState(0);
  const [type, setType] = useState('');
  const [info, setInfo] = useState<{ hex: string; ascii: string; kind: string; bytes: number } | null>(null);
  const [warn, setWarn] = useState('');

  const onFile = async (file?: File) => {
    if (!file) return;
    setName(file.name);
    setSize(file.size);
    setType(file.type || 'application/octet-stream');
    setWarn(file.size > 80 * 1024 * 1024 ? 'huge file. sniffing the first 16 bytes only so the tab stays chill.' : '');
    const slice = await file.slice(0, 16).arrayBuffer();
    setInfo(parseHeaders(slice));
  };

  const pretty = useMemo(() => {
    if (size < 1024) return size + ' b';
    if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' kb';
    if (size < 1024 * 1024 * 1024) return (size / (1024 * 1024)).toFixed(2) + ' mb';
    return (size / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
  }, [size]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">ridge</p>
          <h1 className="text-3xl font-semibold mb-3">sniff a local file.</h1>
          <p className="text-neutral-400 text-sm mb-6">magic bytes, size, mime. stays on this machine. no upload unless you hop to drop.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition mb-6">
            <input type="file" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            <p className="text-white font-medium">pick a file to inspect</p>
            <p className="text-xs text-neutral-500 mt-2">no cap. we only read the header.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mb-4">{warn}</p>}
          {name && (
            <div className="space-y-3 text-sm">
              <p className="text-white">{name}</p>
              <p className="text-neutral-400">{pretty} · {type || 'no mime'}</p>
              {info && (
                <>
                  <p className="text-neutral-300">guess: {info.kind}</p>
                  <p className="font-mono text-[12px] text-neutral-500 break-all">{info.hex}</p>
                  <p className="font-mono text-[12px] text-neutral-600">{info.ascii}</p>
                </>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
