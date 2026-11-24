import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { publishLocalFile } from '../lib/cloudShare';

export default function OrbitDeskPage() {
  const { navigate } = useRouter();
  const [center, setCenter] = useState('central idea');
  const [nodes, setNodes] = useState<string[]>(['first orbit', 'second orbit', 'third orbit']);
  const [accent, setAccent] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{url?: string; embed?: string; warn?: string} | null>(null);

  const addNode = () => setNodes((n) => [...n, `orbit ${n.length + 1}`]);
  const updateNode = (i: number, v: string) => setNodes((n) => n.map((x, idx) => idx === i ? v : x));

  const md = useMemo(() => {
    return `# ${center}\n\n${nodes.map((n, i) => `- **${i + 1}.** ${n}`).join('\n')}\n\n_shared from orbit desk · rankvault_`;
  }, [center, nodes]);

  const share = async () => {
    setBusy(true);
    try {
      const file = new File([md], `${center.slice(0, 20).replace(/[^a-z0-9]/gi, '_') || 'orbit'}.md`, { type: 'text/markdown' });
      const res = await publishLocalFile(file, {
        caption: `Orbit: ${center}`,
        color: accent,
        cardTitle: center,
      });
      if (res.ok) {
        setResult({ url: res.url, embed: res.embed, warn: res.warn || undefined });
      } else {
        alert(res.error || 'share failed');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 100, damping: 20 }}>
          <p className="text-[#0A84FF] text-sm font-medium mb-2 tracking-wide">orbit desk</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-2">ideas in orbit.</h1>
          <p className="text-neutral-400 text-sm mb-8 leading-relaxed">
            Place a center and let thoughts orbit it. Publish the map as a clean markdown share. Soft size warnings only. Polished Discord embeds on every link. Apple-style springs throughout.
          </p>

          <div className="glass rounded-3xl p-6 mb-6">
            <label className="block text-xs text-neutral-500 mb-1">center</label>
            <input
              value={center}
              onChange={(e) => setCenter(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white text-lg font-medium mb-6 focus:outline-none focus:border-white/30"
            />
            <div className="space-y-3 mb-6">
              {nodes.map((n, i) => (
                <motion.div key={i} layout className="flex gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium" style={{ background: accent + '22', color: accent }}>{i + 1}</div>
                  <input
                    value={n}
                    onChange={(e) => updateNode(i, e.target.value)}
                    className="flex-1 bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-white/25"
                  />
                </motion.div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={addNode} className="px-4 py-2 rounded-full bg-white/10 text-sm hover:bg-white/15 transition">add orbit</button>
              <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full border border-white/20 bg-transparent cursor-pointer" />
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={share}
            disabled={busy}
            className="w-full py-3.5 rounded-full bg-[#0A84FF] text-white font-medium hover:bg-[#3A9DFF] transition disabled:opacity-50"
          >
            {busy ? 'publishing…' : 'publish orbit'}
          </motion.button>

          {result && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 glass rounded-2xl p-5 text-sm">
              <p className="text-neutral-400 mb-2">shared</p>
              {result.warn && <p className="text-amber-400 text-xs mb-2">{result.warn}</p>}
              <a href={result.embed} className="text-[#0A84FF] break-all hover:underline">{result.embed}</a>
              <button onClick={() => navigator.clipboard.writeText(result.embed || '')} className="mt-3 text-xs text-neutral-500 hover:text-white">copy link</button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
