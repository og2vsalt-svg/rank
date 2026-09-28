import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { shareUrls } from '../lib/cloudShare';

function hexOk(h: string) {
  return /^#?[0-9a-f]{6}$/i.test(h.trim());
}

function norm(h: string) {
  const s = h.trim().replace(/^#/, '');
  return '#' + s.toLowerCase();
}

export default function LumenboxPage() {
  const [hex, setHex] = useState('#0a84ff');
  const [label, setLabel] = useState('rankvault swatch');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');
  const [embed, setEmbed] = useState('');

  const color = useMemo(() => (hexOk(hex) ? norm(hex) : '#0a84ff'), [hex]);

  const paint = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('no canvas');
    ctx.fillStyle = '#050506';
    ctx.fillRect(0, 0, 1200, 630);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(80, 80, 1040, 470, 48);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(80, 430, 1040, 120);
    ctx.fillStyle = '#fff';
    ctx.font = '600 42px Inter, system-ui, sans-serif';
    ctx.fillText(label.slice(0, 42) || 'swatch', 120, 490);
    ctx.font = '500 24px Inter, system-ui, sans-serif';
    ctx.fillText(color, 120, 530);
    return canvas.toDataURL('image/png');
  };

  const send = async () => {
    setErr('');
    setBusy(true);
    try {
      const dataUrl = paint();
      const blob = await (await fetch(dataUrl)).blob();
      const r = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${(label || 'swatch').replace(/\s+/g, '-').toLowerCase()}.png`,
          type: 'image/png',
          size: blob.size,
          dataUrl,
        }),
      });
      const json = await r.json();
      if (!r.ok || !json?.ok) throw new Error(json?.error || 'share failed');
      const urls = shareUrls(json.id);
      setLink(urls.app);
      setEmbed(urls.embed || `${window.location.origin}/s/${json.id}`);
      setWarn(json.warn || '');
      try { await navigator.clipboard.writeText(urls.embed || urls.app); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'could not ship swatch');
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
          <p className="text-[#0a84ff] text-sm mb-2">lumenbox</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">paint a color card, then make it public.</h1>
          <p className="text-neutral-400 text-sm mb-6">not a vault. a 1200×630 swatch lands in the share db so discord unfurls a real image.</p>
          <div className="rounded-[24px] h-40 mb-6" style={{ background: color }} />
          <label className="block text-xs text-neutral-500 mb-1">hex</label>
          <input value={hex} onChange={(e) => setHex(e.target.value)} className="w-full mb-4 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-[#0a84ff]/50" />
          <label className="block text-xs text-neutral-500 mb-1">label</label>
          <input value={label} onChange={(e) => setLabel(e.target.value)} className="w-full mb-6 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-[#0a84ff]/50" />
          <button onClick={send} disabled={busy} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-200 disabled:opacity-50">
            {busy ? 'shipping…' : 'publish swatch'}
          </button>
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {embed && (
            <div className="mt-6 space-y-2">
              <p className="text-xs text-neutral-400 break-all">discord: {embed}</p>
              <p className="text-xs text-neutral-500 break-all">app: {link}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
