import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';

function readText(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(r.error);
    r.readAsText(file);
  });
}

export default function OxbowPage() {
  const { addText } = useVault();
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [nameA, setNameA] = useState('');
  const [nameB, setNameB] = useState('');
  const [out, setOut] = useState('');
  const [warn, setWarn] = useState('');
  const [msg, setMsg] = useState('');

  const onPick = async (which: 'a' | 'b', list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    if (f.size > 20 * 1024 * 1024) setWarn('one of these is chunky. merge still runs, tab might hitch. no cap.');
    const text = await readText(f);
    if (which === 'a') { setA(text); setNameA(f.name); }
    else { setB(text); setNameB(f.name); }
  };

  const merge = () => {
    const joined = [`--- ${nameA || 'left'} ---`, a, '', `--- ${nameB || 'right'} ---`, b].join('\n');
    setOut(joined);
    setMsg('');
  };

  const save = async () => {
    if (!out) return;
    const res = await addText(`oxbow-${Date.now()}.txt`, out, 'inbox');
    setMsg(res.ok ? 'parked in vault inbox' : res.error || 'could not save');
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">oxbow</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">braid two local files.</h1>
          <p className="text-neutral-400 text-sm mb-6">reads two text dumps on this device and stitches them. nothing ships unless you park it in the vault.</p>
          {warn && <p className="text-xs text-amber-300/80 mb-4">{warn}</p>}
          <div className="grid sm:grid-cols-2 gap-3 mb-4">
            <label className="rounded-2xl border border-dashed border-white/15 p-6 text-center cursor-pointer hover:border-[#0a84ff]/40 transition">
              <input type="file" className="hidden" onChange={(e) => onPick('a', e.target.files)} />
              <p className="text-sm">{nameA || 'drop left file'}</p>
            </label>
            <label className="rounded-2xl border border-dashed border-white/15 p-6 text-center cursor-pointer hover:border-[#0a84ff]/40 transition">
              <input type="file" className="hidden" onChange={(e) => onPick('b', e.target.files)} />
              <p className="text-sm">{nameB || 'drop right file'}</p>
            </label>
          </div>
          <div className="flex gap-2 mb-4">
            <button onClick={merge} className="px-4 py-2 rounded-full bg-[#0a84ff] text-white text-sm">merge</button>
            <button onClick={save} className="px-4 py-2 rounded-full bg-white/8 border border-white/10 text-sm">save to vault</button>
          </div>
          {msg && <p className="text-xs text-neutral-400 mb-3">{msg}</p>}
          {out && <pre className="text-xs text-neutral-300 whitespace-pre-wrap max-h-80 overflow-auto rounded-2xl bg-black/30 p-4">{out.slice(0, 20000)}</pre>}
        </motion.div>
      </div>
    </div>
  );
}
