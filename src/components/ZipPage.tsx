import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function crc32(buf: Uint8Array) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function strBytes(s: string) {
  return new TextEncoder().encode(s);
}

function u16(n: number) {
  const b = new Uint8Array(2);
  new DataView(b.buffer).setUint16(0, n, true);
  return b;
}
function u32(n: number) {
  const b = new Uint8Array(4);
  new DataView(b.buffer).setUint32(0, n, true);
  return b;
}

async function buildZip(files: File[]) {
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;
  for (const f of files) {
    const data = new Uint8Array(await f.arrayBuffer());
    const name = strBytes(f.name.replace(/\\/g, '/'));
    const crc = crc32(data);
    const local = new Uint8Array(30 + name.length + data.length);
    local.set([0x50, 0x4b, 0x03, 0x04], 0);
    local.set(u16(20), 4);
    local.set(u16(0), 6);
    local.set(u16(0), 8);
    local.set(u16(0), 10);
    local.set(u16(0), 12);
    local.set(u32(crc), 14);
    local.set(u32(data.length), 18);
    local.set(u32(data.length), 22);
    local.set(u16(name.length), 26);
    local.set(u16(0), 28);
    local.set(name, 30);
    local.set(data, 30 + name.length);
    const central = new Uint8Array(46 + name.length);
    central.set([0x50, 0x4b, 0x01, 0x02], 0);
    central.set(u16(20), 4);
    central.set(u16(20), 6);
    central.set(u16(0), 8);
    central.set(u16(0), 10);
    central.set(u16(0), 12);
    central.set(u16(0), 14);
    central.set(u32(crc), 16);
    central.set(u32(data.length), 20);
    central.set(u32(data.length), 24);
    central.set(u16(name.length), 28);
    central.set(u16(0), 30);
    central.set(u16(0), 32);
    central.set(u16(0), 34);
    central.set(u16(0), 36);
    central.set(u32(0), 38);
    central.set(u32(offset), 42);
    central.set(name, 46);
    locals.push(local);
    centrals.push(central);
    offset += local.length;
  }
  const centralSize = centrals.reduce((a, b) => a + b.length, 0);
  const end = new Uint8Array(22);
  end.set([0x50, 0x4b, 0x05, 0x06], 0);
  end.set(u16(0), 4);
  end.set(u16(0), 6);
  end.set(u16(files.length), 8);
  end.set(u16(files.length), 10);
  end.set(u32(centralSize), 12);
  end.set(u32(offset), 16);
  end.set(u16(0), 20);
  const total = offset + centralSize + 22;
  const out = new Uint8Array(total);
  let p = 0;
  for (const l of locals) { out.set(l, p); p += l.length; }
  for (const c of centrals) { out.set(c, p); p += c.length; }
  out.set(end, p);
  return out;
}

export default function ZipPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');

  const pack = async () => {
    if (!files.length) return;
    const total = files.reduce((a, f) => a + f.size, 0);
    setWarn(total > 80 * 1024 * 1024 ? 'this pack is chunky. no cap, just gonna take a minute.' : '');
    setBusy(true);
    try {
      const zip = await buildZip(files);
      const blob = new Blob([zip], { type: 'application/zip' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'rank-pack.zip';
      a.click();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen mesh">
      <Navbar />
      <main className="max-w-2xl mx-auto px-5 pt-28 pb-20">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0a84ff] text-sm mb-2">pack</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">zip a handful of files</h1>
          <p className="text-neutral-500 text-sm mb-8">runs in the tab. no server. no hard size cap.</p>
          <label className="glass block rounded-3xl p-10 text-center cursor-pointer">
            <input type="file" multiple className="hidden" onChange={(e) => setFiles(Array.from(e.target.files || []))} />
            <span className="text-sm text-neutral-300">pick files</span>
          </label>
          {files.length > 0 && (
            <ul className="mt-6 text-sm text-neutral-400 space-y-1">
              {files.map((f) => <li key={f.name}>{f.name} · {(f.size / 1024).toFixed(1)} kb</li>)}
            </ul>
          )}
          {warn && <p className="text-xs text-amber-400/80 mt-3">{warn}</p>}
          <button onClick={pack} disabled={busy || !files.length} className="mt-6 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">
            {busy ? 'packing…' : 'download zip'}
          </button>
        </motion.div>
      </main>
    </div>
  );
}
