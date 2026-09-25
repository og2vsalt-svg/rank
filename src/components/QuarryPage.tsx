import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(2) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

function guess(hex: string, mime: string) {
  const h = hex.toLowerCase();
  if (h.startsWith('89504e47')) return 'png';
  if (h.startsWith('ffd8ff')) return 'jpeg';
  if (h.startsWith('47494638')) return 'gif';
  if (h.startsWith('25504446')) return 'pdf';
  if (h.startsWith('504b0304')) return 'zip / office';
  if (h.startsWith('1f8b08')) return 'gzip';
  if (h.startsWith('7f454c46')) return 'elf';
  if (h.startsWith('0000001866747970') || h.includes('66747970')) return 'mp4 / isobmff';
  if (h.startsWith('52494646')) return 'riff (wav/avi/webp)';
  if (h.startsWith('494433') || h.startsWith('fff3') || h.startsWith('fffb')) return 'mp3';
  return mime.split('/')[1] || 'unknown';
}

export default function QuarryPage() {
  const [card, setCard] = useState<{ name: string; size: number; type: string; hex: string; kind: string } | null>(null);
  const [warn, setWarn] = useState('');

  const onFile = async (file?: File) => {
    if (!file) return;
    if (file.size > 40 * 1024 * 1024) setWarn('chunky stone. we only chip the first bytes so the tab should stay ok.');
    else setWarn('');
    const slice = file.slice(0, 24);
    const buf = await slice.arrayBuffer();
    const bytes = new Uint8Array(buf);
    const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
    setCard({ name: file.name, size: file.size, type: file.type || 'application/octet-stream', hex, kind: guess(hex, file.type || '') });
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">quarry</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">chip the first bytes.</h1>
          <p className="text-neutral-400 text-sm mb-6">peek a local file header. stays in the tab. no upload unless you bounce to drop later.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition">
            <input type="file" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            <p className="text-white font-medium">drop a stone</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {card && (
            <div className="mt-6 rounded-2xl bg-black/30 p-5 space-y-2">
              <p className="text-white font-medium">{card.name}</p>
              <p className="text-xs text-neutral-500">{pretty(card.size)} · {card.type}</p>
              <p className="text-sm text-[#0a84ff]">{card.kind}</p>
              <p className="text-[11px] text-neutral-400 break-all font-mono">{card.hex}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
