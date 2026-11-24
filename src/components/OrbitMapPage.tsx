import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function OrbitMapPage() {
  const { navigate } = useRouter();
  const [center, setCenter] = useState('');
  const [orbits, setOrbits] = useState<string[]>(['', '', '']);
  const [color, setColor] = useState('#AF52DE');
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);

  const updateOrbit = (i: number, v: string) => {
    setOrbits((prev) => prev.map((o, idx) => (idx === i ? v : o)));
  };

  const publish = async () => {
    if (!center.trim() || busy) return;
    setBusy(true);
    const body = `# ${center.trim()}\n\n${orbits.filter(Boolean).map((o, i) => `## Orbit ${i + 1}\n${o}`).join('\n\n')}\n\n---\nMapped on Orbit Desk.`;
    const file = new File([body], `${center.trim().slice(0, 40).replace(/\s+/g, '-')}.md`, { type: 'text/markdown' });
    try {
      const res = await publishLocalFile(file, {
        caption: `Orbit map: ${center.trim()}`,
        color,
        cardTitle: center.trim(),
        meta: { desk: 'orbitmap', orbits: orbits.filter(Boolean).length },
      });
      if (res.ok && res.id) {
        setLink(shareUrls(res.id).app);
      }
    } catch {
      // silent
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 95, damping: 21 }}
          className="glass rounded-[36px] p-8 md:p-12 border border-white/5"
        >
          <p className="text-[13px] font-medium tracking-wide text-[#AF52DE] mb-2">Orbit Map</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3 text-white">Map the center.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Place a central idea. Let thoughts orbit around it. Publish the whole map as a clean markdown share with Discord-ready embeds.
          </p>

          <input
            value={center}
            onChange={(e) => setCenter(e.target.value)}
            placeholder="Central idea"
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[16px] text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/30 transition mb-6"
          />

          <div className="space-y-3 mb-6">
            {orbits.map((o, i) => (
              <motion.input
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                value={o}
                onChange={(e) => updateOrbit(i, e.target.value)}
                placeholder={`Orbit ${i + 1}`}
                className="w-full bg-black/20 border border-white/8 rounded-xl px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/25"
              />
            ))}
            <button
              onClick={() => setOrbits((p) => [...p, ''])}
              className="text-sm text-neutral-400 hover:text-white transition"
            >
              + add orbit
            </button>
          </div>

          <div className="flex items-center gap-3 mb-8">
            <label className="text-sm text-neutral-400">Accent</label>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-10 rounded-full border border-white/10 bg-transparent cursor-pointer" />
          </div>

          <motion.button
            whileTap={{ scale: 0.985 }}
            whileHover={{ scale: 1.005 }}
            onClick={publish}
            disabled={busy || !center.trim()}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl bg-[#AF52DE]"
          >
            {busy ? 'Mapping…' : 'Publish orbit map'}
          </motion.button>

          {link && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 glass rounded-2xl p-4">
              <p className="text-sm text-neutral-400 mb-1">Map ready</p>
              <button onClick={() => navigate('share', link.split('/').pop() || '')} className="text-[#AF52DE] text-sm break-all text-left">{link}</button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
