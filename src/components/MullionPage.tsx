import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function MullionPage() {
  const [raw, setRaw] = useState('');
  const [cols, setCols] = useState(2);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');

  const panes = useMemo(() => {
    const lines = raw.split('\n');
    const n = Math.max(1, Math.min(4, cols));
    const out = Array.from({ length: n }, () => [] as string[]);
    lines.forEach((line, i) => out[i % n].push(line));
    return out;
  }, [raw, cols]);

  const publish = async () => {
    if (!raw.trim()) return;
    setBusy(true);
    setErr('');
    try {
      const body = panes.map((p, i) => `pane ${i + 1}\n${p.join('\n')}`).join('\n\n---\n\n');
      const file = new File([body], 'mullion.txt', { type: 'text/plain' });
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ''));
        r.onerror = () => reject(new Error('read failed'));
        r.readAsDataURL(file);
      });
      const id = uid();
      const res = await publishShare({
        id,
        name: file.name,
        type: 'text/plain',
        size: file.size,
        dataUrl,
        author: 'mullion',
      });
      if (!res.ok) throw new Error(res.error || 'split failed');
      const urls = shareUrls(res.id || id);
      setEmbed(urls.embed);
      try {
        await navigator.clipboard.writeText(urls.embed);
      } catch {}
    } catch (e: any) {
      setErr(e?.message || 'split failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">mullion</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">split a draft into quiet panes.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            a window frame for text. publish the panes as one public drop when you are ready.
          </p>
          <textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            rows={8}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-[#0a84ff]/50 mb-4"
            placeholder="pour a draft"
          />
          <div className="flex items-center gap-3 mb-5">
            <span className="text-xs text-neutral-500">panes</span>
            {[2, 3, 4].map((n) => (
              <button
                key={n}
                onClick={() => setCols(n)}
                className={`px-3 py-1.5 rounded-full text-xs ${cols === n ? 'bg-white text-black' : 'bg-white/8 text-neutral-300'}`}
              >
                {n}
              </button>
            ))}
          </div>
          <div className={`grid gap-3 mb-5`} style={{ gridTemplateColumns: `repeat(${Math.max(1, cols)}, minmax(0,1fr))` }}>
            {panes.map((p, i) => (
              <pre key={i} className="text-[11px] text-neutral-400 bg-black/20 rounded-2xl p-3 whitespace-pre-wrap min-h-[6rem]">
                {p.join('\n') || '·'}
              </pre>
            ))}
          </div>
          <button
            disabled={busy || !raw.trim()}
            onClick={publish}
            className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40"
          >
            {busy ? 'framing…' : 'publish the frame'}
          </button>
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {embed && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5 text-xs text-neutral-400 break-all">
              discord (copied): {embed}
            </motion.p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
