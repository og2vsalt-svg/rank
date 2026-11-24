import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

function hslToHex(h: number, s: number, l: number) {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function generatePalette(seed: string, mode: string) {
  const hex = seed.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s = 0,
    l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);

  const colors = [seed];
  if (mode === 'analogous') {
    colors.push(hslToHex((h + 30) % 360, s, l), hslToHex((h - 30 + 360) % 360, s, l), hslToHex((h + 15) % 360, s, Math.min(l + 10, 95)), hslToHex((h - 15 + 360) % 360, s, Math.max(l - 10, 5)));
  } else if (mode === 'triadic') {
    colors.push(hslToHex((h + 120) % 360, s, l), hslToHex((h + 240) % 360, s, l), hslToHex((h + 120) % 360, s, Math.min(l + 15, 90)), hslToHex((h + 240) % 360, s, Math.max(l - 15, 10)));
  } else {
    // complementary
    colors.push(hslToHex((h + 180) % 360, s, l), hslToHex((h + 180) % 360, Math.max(s - 20, 10), Math.min(l + 20, 90)), hslToHex(h, Math.min(s + 10, 100), Math.max(l - 15, 5)), hslToHex(h, s, Math.min(l + 25, 95)));
  }
  return colors.slice(0, 5);
}

export default function HarmonyDeskPage() {
  const { navigate } = useRouter();
  const [seed, setSeed] = useState('#0A84FF');
  const [mode, setMode] = useState('analogous');
  const [name, setName] = useState('quiet harmony');
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const palette = useMemo(() => generatePalette(seed, mode), [seed, mode]);

  const publish = async () => {
    setBusy(true);
    setError(null);
    setLink(null);
    try {
      const payload = {
        name,
        seed,
        mode,
        colors: palette,
        created: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const file = new File([blob], `${name.replace(/\s+/g, '-')}.json`, { type: 'application/json' });
      const res = await publishLocalFile(file, {
        caption: `${name} · ${mode} palette from ${seed}`,
        color: seed,
        cardTitle: name,
        meta: { desk: 'harmony', kind: 'color-palette', colors: palette },
      });
      if (res.ok && res.id) {
        setLink(shareUrls(res.id).app);
      } else {
        setError(res.error || 'could not share');
      }
    } catch (e: any) {
      setError(e.message || 'failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 20 }}
          className="glass rounded-[36px] p-8 md:p-12 border border-white/5"
        >
          <p className="text-[13px] font-medium tracking-wide text-[#0A84FF] mb-2">Harmony Desk</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3 text-white">Quiet color harmony.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Pick a seed, choose a relation, name the set, and publish a permanent palette share. Soft warnings only. Discord embeds included.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <label className="text-xs text-neutral-500 mb-1 block">seed</label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={seed}
                  onChange={(e) => setSeed(e.target.value)}
                  className="w-12 h-12 rounded-2xl border border-white/10 bg-transparent cursor-pointer"
                />
                <input
                  value={seed}
                  onChange={(e) => setSeed(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white font-mono text-sm outline-none focus:border-[#0A84FF]/40"
                />
              </div>
            </div>
            <div className="flex-1">
              <label className="text-xs text-neutral-500 mb-1 block">relation</label>
              <div className="flex gap-1">
                {['analogous', 'complementary', 'triadic'].map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`flex-1 py-2.5 rounded-2xl text-xs font-medium transition ${
                      mode === m ? 'bg-[#0A84FF] text-white' : 'bg-white/5 text-neutral-400 hover:bg-white/10'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="palette name"
            className="w-full mb-6 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-neutral-500 outline-none focus:border-[#0A84FF]/40"
          />

          <div className="grid grid-cols-5 gap-2 mb-8">
            {palette.map((c, i) => (
              <motion.div
                key={c + i}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04, type: 'spring', stiffness: 140, damping: 18 }}
                className="aspect-square rounded-2xl border border-white/10 shadow-inner"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

          <motion.button
            whileTap={{ scale: 0.985 }}
            whileHover={{ scale: 1.005 }}
            onClick={publish}
            disabled={busy}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl bg-[#0A84FF]"
          >
            {busy ? 'Sharing…' : 'Share palette'}
          </motion.button>

          {link && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 text-center">
              <p className="text-sm text-neutral-400 mb-2">live share</p>
              <button onClick={() => navigate('share', link.split('/').pop() || '')} className="text-[#0A84FF] text-sm underline">
                {link}
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
