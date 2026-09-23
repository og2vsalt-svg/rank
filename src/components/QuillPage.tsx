import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function QuillPage() {
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [who, setWho] = useState('');
  const stamp = useMemo(() => new Date().toISOString(), []);

  const receipt = `rankvault receipt\nfile: ${name || '—'}\nfrom: ${who || 'anonymous'}\nwhen: ${stamp}\nnote: ${note || 'none'}\n`;

  const save = () => {
    const blob = new Blob([receipt], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'rankvault-receipt.txt';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">quill</p>
          <h1 className="text-3xl font-semibold mb-3">sign a receipt for a drop.</h1>
          <p className="text-neutral-400 text-sm mb-6">not storage. just a little signed slip you can attach to a share.</p>
          <div className="space-y-3 mb-6">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="file name" className="w-full px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none" />
            <input value={who} onChange={(e) => setWho(e.target.value)} placeholder="your name" className="w-full px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none" />
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="what this drop is for" rows={3} className="w-full px-4 py-3 rounded-3xl bg-white/5 border border-white/10 text-sm outline-none resize-none" />
          </div>
          <pre className="text-xs text-neutral-400 bg-black/30 rounded-2xl p-4 mb-6 whitespace-pre-wrap">{receipt}</pre>
          <button onClick={save} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">download receipt</button>
        </motion.div>
      </div>
    </div>
  );
}
