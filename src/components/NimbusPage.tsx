import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from './Router';
import { publishLocalFile } from '../lib/cloudShare';
import Navbar from './Navbar';

export default function NimbusPage() {
  const { navigate } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [color, setColor] = useState('#0a84ff');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{id?: string; embed?: string; warn?: string} | null>(null);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const onFile = (f: File | null) => {
    setFile(f);
    if (f && f.size > 40 * 1024 * 1024) setError('large file — upload may feel slow, but no hard limit.');
    else setError('');
  };

  const submit = async () => {
    if (!file && !note.trim()) return setError('add a note or a file');
    setBusy(true);
    setError('');
    try {
      const dummyFile = file || new File([note], 'nimbus.txt', { type: 'text/plain' });
      const res = await publishLocalFile(dummyFile, { caption: note, color, cardTitle: 'nimbus' });
      if (res.ok) setResult({ id: res.id, embed: res.embed, warn: res.warn || undefined });
      else setError(res.error || 'failed');
    } catch (e: any) {
      setError(e.message || 'error');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-24 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0a84ff] text-sm font-medium mb-2">nimbus</p>
          <h1 className="text-4xl font-semibold tracking-tight text-white mb-3">a soft cloud for a note and a file.</h1>
          <p className="text-neutral-400 mb-8">drop a local file or write a floating line. it lands in the share table. discord gets a clean card. large drops warned, never refused.</p>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="glass rounded-3xl p-6 space-y-4">
          <div
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center cursor-pointer hover:border-[#0a84ff]/40 transition"
          >
            <p className="text-sm text-neutral-400">{file ? file.name : 'drop or click for a file (optional)'}</p>
            {file && <p className="text-xs text-neutral-500 mt-1">{(file.size / 1024 / 1024).toFixed(1)} mb</p>}
            <input ref={inputRef} type="file" className="hidden" onChange={(e) => onFile(e.target.files?.[0] || null)} />
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="a short floating note..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-[#0a84ff]/50 min-h-[100px]"
          />
          <div className="flex items-center gap-3">
            <label className="text-xs text-neutral-500">accent</label>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-10 rounded-full border-0 bg-transparent" />
          </div>
          {error && <p className="text-xs text-amber-300">{error}</p>}
          <button
            onClick={submit}
            disabled={busy}
            className="w-full py-3 rounded-full bg-[#0a84ff] text-white text-sm font-medium hover:bg-[#409cff] disabled:opacity-50 transition active:scale-[0.98]"
          >
            {busy ? 'lifting…' : 'lift to the cloud'}
          </button>
        </motion.div>
        {result && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 glass rounded-3xl p-5">
            <p className="text-sm text-white mb-2">shared</p>
            <p className="text-xs text-neutral-400 break-all mb-3">{result.embed}</p>
            <button onClick={() => navigator.clipboard.writeText(result.embed || '')} className="text-xs px-4 py-2 rounded-full bg-white text-black">copy link</button>
            {result.warn && <p className="text-xs text-amber-300/80 mt-2">{result.warn}</p>}
          </motion.div>
        )}
      </div>
    </div>
  );
}
