import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';
import { useRouter } from './Router';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(1) + ' mb';
}

export default function KetchPage() {
  const { navigate } = useRouter();
  const [main, setMain] = useState<File | null>(null);
  const [mizzen, setMizzen] = useState<File | null>(null);
  const [sentence, setSentence] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');

  const noteSize = (a: File | null, b: File | null) => {
    const big = (a && a.size > 24 * 1024 * 1024) || (b && b.size > 24 * 1024 * 1024);
    setWarn(big ? 'one of the masts is heavy. the send may feel slow. nothing is refused for size.' : '');
  };

  const fileIt = async () => {
    if (!main || !mizzen || !sentence.trim()) return;
    setBusy(true);
    setErr('');
    try {
      const a = await publishLocalFile(main, { author: 'ketch', caption: 'main mast', cardTitle: main.name });
      if (!a.ok || !a.id) throw new Error(a.error || 'main mast did not land');
      const b = await publishLocalFile(mizzen, { author: 'ketch', caption: 'mizzen mast', cardTitle: mizzen.name });
      if (!b.ok || !b.id) throw new Error(b.error || 'mizzen did not land');
      const res = await fetch('/api/ketch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentence, mainShareId: a.id, mizzenShareId: b.id, mainName: main.name, mizzenName: mizzen.name, author: 'ketch' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ketch table did not take the pair');
      const card = `${location.origin}/ketch/${data.ketch.id}`;
      setLink(card);
      if (a.warn || b.warn) setWarn(a.warn || b.warn || '');
      try { await navigator.clipboard.writeText(card); } catch {}
      navigate('ketch', data.ketch.id);
    } catch (e: any) {
      setErr(e?.message || 'failed');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[28px] p-7">
          <p className="text-[#64d2ff] text-sm mb-2">ketch</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">two masts, one sentence.</h1>
          <p className="text-neutral-400 text-sm mb-6">each local file lands in the share table. the sentence — which mast carries what — lives in the ketch table. discord unfurls /ketch and both /s links. no size gate.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#64d2ff]/50 p-6 text-center mb-3 transition-colors duration-300">
            <input type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0] || null; setMain(f); noteSize(f, mizzen); }} />
            <span className="text-sm text-neutral-300">{main ? `main · ${main.name} · ${pretty(main.size)}` : 'main mast file'}</span>
          </label>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#64d2ff]/50 p-6 text-center mb-4 transition-colors duration-300">
            <input type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0] || null; setMizzen(f); noteSize(main, f); }} />
            <span className="text-sm text-neutral-300">{mizzen ? `mizzen · ${mizzen.name} · ${pretty(mizzen.size)}` : 'mizzen file'}</span>
          </label>
          <textarea value={sentence} onChange={(e) => setSentence(e.target.value)} rows={3} placeholder="the main carries the photo. the mizzen carries the note." className="w-full mb-4 rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#64d2ff]/60 transition-colors" />
          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}
          <button onClick={fileIt} disabled={busy || !main || !mizzen || !sentence.trim()} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40 active:scale-[0.98] transition-transform">
            {busy ? 'stepping the masts…' : 'file the pair'}
          </button>
          {link && <p className="text-xs text-neutral-500 mt-4 break-all">discord card copied: {link}</p>}
        </motion.div>
      </div>
    </div>
  );
}
