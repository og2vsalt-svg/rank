import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function WindrowPage() {
  const [out, setOut] = useState('');
  const [name, setName] = useState('');
  const [warn, setWarn] = useState('');
  const [copied, setCopied] = useState(false);

  const onFile = async (list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    setName(f.name);
    setWarn(f.size > 10 * 1024 * 1024 ? 'chunky list. sort still runs locally. no hard limit.' : '');
    const text = await f.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    lines.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true }));
    setOut(lines.join('\n'));
  };

  const copy = async () => {
    if (!out) return;
    await navigator.clipboard.writeText(out);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const download = () => {
    if (!out) return;
    const blob = new Blob([out], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (name || 'list').replace(/(\.[^.]+)?$/, '.sorted$1') || 'sorted.txt';
    a.click();
    URL.revokeObjectURL(a.href);
  };

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
          <p className="text-[#0a84ff] text-sm mb-2">windrow</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">rake a list into order.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            sort lines on this device. blank rows fall away. handy before you paste or share.
          </p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition">
            <input type="file" accept=".txt,.md,.csv,.tsv,text/*" className="hidden" onChange={(e) => onFile(e.target.files)} />
            <p className="text-white font-medium">{name || 'drop a local list'}</p>
            <p className="text-xs text-neutral-500 mt-2">no file limit. just a slowness ping if it is huge.</p>
          </label>
          {warn && <p className="text-amber-300/90 text-xs mt-3">{warn}</p>}
          {out && (
            <>
              <div className="mt-6 flex gap-2">
                <button onClick={copy} className="px-4 py-2 rounded-full bg-[#0a84ff] text-white text-sm">{copied ? 'copied' : 'copy'}</button>
                <button onClick={download} className="px-4 py-2 rounded-full bg-white/8 text-white text-sm">download</button>
              </div>
              <pre className="mt-4 max-h-80 overflow-auto text-xs text-neutral-300 whitespace-pre-wrap">{out}</pre>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
