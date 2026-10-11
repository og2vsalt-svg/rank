import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from './Router';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

export default function StudioPage() {
  const { navigate } = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ id: string; embed: string; name: string } | null>(null);
  const [err, setErr] = useState('');
  const [caption, setCaption] = useState('');

  const onFiles = async (list: FileList | null) => {
    if (!list || !list[0]) return;
    const file = list[0];
    setBusy(true);
    setErr('');
    setResult(null);
    const res = await publishLocalFile(file, { caption: caption || undefined, cardTitle: file.name });
    setBusy(false);
    if (!res.ok) {
      setErr(res.error || 'could not publish');
      return;
    }
    setResult({ id: res.id || '', embed: res.embed || '', name: file.name });
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 110, damping: 18 }}
          className="glass rounded-[32px] p-8 text-center"
        >
          <p className="text-[#0A84FF] text-sm font-medium tracking-wide mb-2">studio</p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white mb-3">drop once. share forever.</h1>
          <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
            Upload a local file straight to the public database. Get a clean Discord embed link. No size caps — only a note if the transfer might take a moment.
          </p>
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="optional caption for the card"
            className="w-full mb-5 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none focus:border-[#0A84FF]/40"
          />
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={(e) => onFiles(e.target.files)}
          />
          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="px-6 py-3 rounded-full bg-[#0A84FF] text-white text-sm font-medium hover:bg-[#409CFF] transition disabled:opacity-60"
          >
            {busy ? 'sending…' : 'choose a file'}
          </motion.button>
          {err && <p className="mt-5 text-sm text-red-400">{err}</p>}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 text-left glass rounded-2xl p-4"
            >
              <p className="text-xs text-neutral-500 mb-1">published</p>
              <p className="text-white text-sm font-medium mb-3 truncate">{result.name}</p>
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(result.embed);
                }}
                className="text-xs px-3 py-1.5 rounded-full bg-white text-black"
              >
                copy discord link
              </button>
              <p className="mt-2 text-[11px] text-neutral-500 break-all">{result.embed}</p>
            </motion.div>
          )}
          <button onClick={() => navigate('vault')} className="mt-8 text-xs text-neutral-500 hover:text-white transition">
            or open the full vault →
          </button>
        </motion.div>
      </div>
    </div>
  );
}
