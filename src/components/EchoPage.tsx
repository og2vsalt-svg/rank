import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function EchoPage() {
  const [url, setUrl] = useState('https://grook.vercel.app');
  const [ms, setMs] = useState<number | null>(null);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  const ping = async () => {
    setBusy(true);
    setStatus('');
    setMs(null);
    const start = performance.now();
    try {
      await fetch(url, { method: 'HEAD', mode: 'no-cors' });
      setMs(Math.round(performance.now() - start));
      setStatus('echo back (opaque cors so status is just timing)');
    } catch {
      setMs(Math.round(performance.now() - start));
      setStatus('could not reach it from this tab');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">echo</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">how far is that host.</h1>
          <p className="text-sm text-neutral-400 mb-6">not a file tool. just a tiny latency poke so you are not bouncing to another site.</p>
          <div className="flex gap-2">
            <input value={url} onChange={(e) => setUrl(e.target.value)} className="flex-1 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none" />
            <button onClick={ping} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">{busy ? '…' : 'ping'}</button>
          </div>
          {ms !== null && <p className="text-4xl font-semibold mt-8 tracking-tight">{ms}<span className="text-lg text-neutral-500"> ms</span></p>}
          {status && <p className="text-xs text-neutral-500 mt-2">{status}</p>}
        </motion.div>
      </div>
    </div>
  );
}
