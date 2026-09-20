import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function FluxPage() {
  const [text, setText] = useState('hey');
  const [speed, setSpeed] = useState(40);
  const [copied, setCopied] = useState(false);

  const blob = useMemo(() => {
    const html = `<!doctype html><meta charset="utf-8"><title>flux</title><body style="margin:0;background:#050506;color:#f5f5f7;font-family:-apple-system,Inter,sans-serif;display:grid;place-items:center;min-height:100vh"><p id="t" style="font-size:28px;letter-spacing:-.03em"></p><script>const s=${JSON.stringify(text)};const el=document.getElementById('t');let i=0;const tick=()=>{el.textContent=s.slice(0,i);i=i>=s.length?0:i+1};setInterval(tick,${Math.max(12, speed)});</script></body>`;
    return new Blob([html], { type: 'text/html' });
  }, [text, speed]);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20 px-5">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-3">flux</p>
          <h1 className="text-3xl font-semibold text-white tracking-tight">typewriter drop</h1>
          <p className="text-sm text-neutral-500 mt-2 mb-8">write a line, download a tiny html loop. stays off the vault on purpose.</p>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-6 space-y-4">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full h-32 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none resize-none"
            />
            <p className="text-xs text-neutral-500">{speed} ms / glyph</p>
            <input type="range" min={16} max={160} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="w-full" />
            <div className="flex flex-wrap gap-2">
              <a
                href={URL.createObjectURL(blob)}
                download="flux.html"
                className="inline-flex px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium"
              >
                download html
              </a>
              <motion.button whileTap={{ scale: 0.97 }} onClick={copy} className="px-5 py-2.5 rounded-full bg-white/5 text-sm">
                {copied ? 'copied' : 'copy text'}
              </motion.button>
            </div>
            {text.length > 80_000 && <p className="text-xs text-amber-400/80">long script — browser might feel sleepy</p>}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
