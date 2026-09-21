import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

type Packet = { name: string; type: string; size: number; dataUrl: string; at: number };

export default function BridgePage() {
  const [incoming, setIncoming] = useState<Packet | null>(null);
  const [note, setNote] = useState('open this page in two tabs. drop a file in one. it hops.');

  useEffect(() => {
    const ch = new BroadcastChannel('rank-bridge');
    ch.onmessage = (ev) => {
      if (ev.data && ev.data.kind === 'file') setIncoming(ev.data.file);
    };
    return () => ch.close();
  }, []);

  function send(f: File | undefined) {
    if (!f) return;
    if (f.size > 30 * 1024 * 1024) {
      setNote('this one is chunky. no block, but the hop might lag.');
    }
    const reader = new FileReader();
    reader.onload = () => {
      const ch = new BroadcastChannel('rank-bridge');
      ch.postMessage({
        kind: 'file',
        file: { name: f.name, type: f.type, size: f.size, dataUrl: String(reader.result), at: Date.now() },
      });
      ch.close();
      setNote('sent across the bridge');
    };
    reader.readAsDataURL(f);
  }

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">bridge</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">hop a file between tabs.</h1>
          <p className="text-neutral-400 text-sm mb-6">local only. not the cloud. good when you just need a file to appear on the other window.</p>
          <label className="block rounded-[24px] border border-dashed border-white/15 bg-white/[0.03] px-6 py-10 text-center cursor-pointer hover:bg-white/[0.05] transition-colors">
            <input type="file" className="hidden" onChange={(e) => send(e.target.files?.[0])} />
            <p className="text-sm text-neutral-300">send a file across</p>
          </label>
          <p className="text-xs text-neutral-500 mt-4">{note}</p>
          {incoming && (
            <div className="mt-6 rounded-2xl bg-white/[0.04] p-4">
              <p className="text-sm text-white">{incoming.name}</p>
              <p className="text-xs text-neutral-500 mb-3">{incoming.type} · {incoming.size} b</p>
              <a href={incoming.dataUrl} download={incoming.name} className="inline-flex px-4 py-2 rounded-full bg-white text-black text-sm">save here</a>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
