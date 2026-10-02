import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

function relLuminance(hex: string) {
  const n = hex.replace('#', '');
  const ch = [0, 2, 4].map((i) => {
    const c = parseInt(n.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}

function contrast(a: string, b: string) {
  const L1 = relLuminance(a);
  const L2 = relLuminance(b);
  const hi = Math.max(L1, L2);
  const lo = Math.min(L1, L2);
  return (hi + 0.05) / (lo + 0.05);
}

export default function CopingPage() {
  const [ink, setInk] = useState('#f5f5f7');
  const [paper, setPaper] = useState('#0a0a0c');
  const [name, setName] = useState('night ink');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [id, setId] = useState('');

  const ratio = useMemo(() => contrast(ink, paper), [ink, paper]);
  const grade = ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : ratio >= 3 ? 'large text only' : 'thin for body copy';

  const fileSpec = async () => {
    setBusy(true);
    setErr('');
    const body = `coping\n${name}\nink ${ink}\npaper ${paper}\ncontrast ${ratio.toFixed(2)} : 1\n${grade}\n`;
    const file = new File([body], `${name.replace(/[^a-z0-9]+/gi, '-').slice(0, 40) || 'coping'}.txt`, { type: 'text/plain' });
    const res = await publishLocalFile(file, {
      caption: `${name} · ${ratio.toFixed(2)}:1 · ${grade}`,
      cardTitle: name,
      color: ink,
    });
    setBusy(false);
    if (!res.ok || !res.id) {
      setErr(res.error || 'could not file the spec');
      return;
    }
    setId(res.id);
  };

  const urls = id ? shareUrls(id) : null;

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-24 pb-20">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] tracking-[0.16em] uppercase text-white/45">measure</p>
          <h1 className="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight">coping</h1>
          <p className="mt-3 text-neutral-400 max-w-xl leading-relaxed">
            A contrast check for a pair of colours. Not a drawer. File the spec only if you want a Discord card.
          </p>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 rounded-3xl overflow-hidden border border-white/10"
          style={{ background: paper, color: ink }}
        >
          <div className="px-6 py-10">
            <p className="text-xs uppercase tracking-[0.14em] opacity-60">sample</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight">{name || 'night ink'}</p>
            <p className="mt-2 max-w-md text-[15px] leading-relaxed opacity-80">
              The quick brown fox keeps a quiet line. Body copy should sit at 4.5 or better.
            </p>
          </div>
        </motion.section>

        <section className="glass mt-4 rounded-3xl p-5 sm:p-6">
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-2xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-sm outline-none" />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="text-xs text-white/50">ink
              <input type="color" value={ink} onChange={(e) => setInk(e.target.value)} className="mt-1 block h-11 w-full rounded-xl bg-transparent" />
            </label>
            <label className="text-xs text-white/50">paper
              <input type="color" value={paper} onChange={(e) => setPaper(e.target.value)} className="mt-1 block h-11 w-full rounded-xl bg-transparent" />
            </label>
          </div>
          <p className="mt-4 text-2xl font-semibold tracking-tight">{ratio.toFixed(2)} : 1</p>
          <p className="text-sm text-neutral-400">{grade}</p>
          <button onClick={fileSpec} disabled={busy} className="mt-5 rounded-full bg-white text-black px-5 py-2.5 text-sm font-medium disabled:opacity-40">
            {busy ? 'filing…' : 'file the spec'}
          </button>
          {err && <p className="mt-3 text-sm text-red-300">{err}</p>}
          {urls && <p className="mt-3 text-sm text-neutral-300 break-all">{urls.embed}</p>}
        </section>
      </main>
    </div>
  );
}
