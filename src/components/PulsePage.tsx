import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function PulsePage() {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState('');
  const [busy, setBusy] = useState(false);

  const ping = async () => {
    if (!url) return;
    setBusy(true);
    setResult('');
    const start = performance.now();
    try {
      const target = url.startsWith('http') ? url : `https://${url}`;
      await fetch(target, { mode: 'no-cors' });
      setResult(`reached ${target} in ${Math.round(performance.now() - start)}ms (opaque cors ping — just a liveness hint)`);
    } catch (e: any) {
      setResult(e?.message || 'could not reach it from this tab');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">pulse desk</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">poke a url from this tab.</h1>
          <p className="text-neutral-400 text-sm mb-6">not file hosting. a tiny reachability check when a share link feels dead.</p>
          <div className="flex gap-2">
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className="flex-1 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none" />
            <button onClick={ping} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">{busy ? '…' : 'ping'}</button>
          </div>
          {result && <p className="text-sm text-neutral-400 mt-5">{result}</p>}
        </motion.div>
      </div>
    </div>
  );
}
