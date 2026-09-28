import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function wrap(text: string, width: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const next = line ? line + ' ' + w : w;
    if (next.length > width) {
      if (line) lines.push(line);
      line = w;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines.slice(0, 8);
}

function paint(headline: string, body: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 630;
  const g = canvas.getContext('2d')!;
  g.fillStyle = '#f5f5f7';
  g.fillRect(0, 0, 1200, 630);
  g.fillStyle = '#0a84ff';
  g.fillRect(0, 0, 18, 630);
  g.fillStyle = '#111113';
  g.font = '700 54px Inter, system-ui, sans-serif';
  const heads = wrap(headline || 'untitled notice', 28);
  heads.forEach((h, i) => g.fillText(h, 72, 140 + i * 64));
  g.fillStyle = '#44444a';
  g.font = '400 26px Inter, system-ui, sans-serif';
  wrap(body || 'a quiet typeset card from rankvault.', 52).forEach((line, i) => {
    g.fillText(line, 72, 140 + heads.length * 64 + 36 + i * 38);
  });
  g.fillStyle = '#8e8e93';
  g.font = '500 16px Inter, system-ui, sans-serif';
  g.fillText('rankvault · linotype', 72, 586);
  return canvas.toDataURL('image/jpeg', 0.92);
}

export default function LinotypePage() {
  const [headline, setHeadline] = useState('');
  const [body, setBody] = useState('');
  const [preview, setPreview] = useState('');
  const [embed, setEmbed] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const make = async () => {
    setBusy(true);
    setMsg('');
    try {
      const dataUrl = paint(headline, body);
      setPreview(dataUrl);
      const id = uid();
      const res = await publishShare({
        id,
        name: (headline.trim() || 'linotype') + '.jpg',
        type: 'image/jpeg',
        size: Math.round((dataUrl.length * 3) / 4),
        dataUrl,
        author: 'linotype',
      });
      if (!res.ok) setMsg(res.error || 'press missed the db');
      else {
        setEmbed(shareUrls(res.id || id).embed);
        setMsg('notice card published. paste the /s link in discord.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">linotype</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">set a notice, ship a card.</h1>
          <p className="text-neutral-400 text-sm mb-6">typesetting desk. words become a 1200×630 still that discord can unfurl. nothing lives in the vault unless you put it there later.</p>
          <input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="headline" className="w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none mb-3 focus:border-[#0a84ff]/50" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="a few lines" rows={4} className="w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none mb-5 resize-none focus:border-[#0a84ff]/50" />
          <button onClick={make} disabled={busy} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">
            {busy ? 'setting type…' : 'print and publish'}
          </button>
          {msg && <p className="text-xs text-neutral-400 mt-4">{msg}</p>}
          {preview && <img src={preview} alt="" className="mt-6 w-full rounded-2xl" />}
          {embed && <p className="text-xs text-neutral-500 mt-3 break-all">discord link: {embed}</p>}
        </motion.div>
      </div>
    </div>
  );
}
