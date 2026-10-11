import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function GrokDropPage() {
  const { addFiles } = useVault();
  const { navigate } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [share, setShare] = useState<{ id: string; url: string } | null>(null);

  const onSelect = (list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    setFile(f);
    setWarn(f.size > 40 * 1024 * 1024 ? 'large file. drop may feel slow while sending. no hard limits.' : '');
    setShare(null);
  };

  const send = async () => {
    if (!file) return;
    setBusy(true);
    setWarn('');
    try {
      await addFiles([file], 'grokdrop');
      const res = await publishLocalFile(file, {
        caption: caption || 'grok drop',
        color: '#0A84FF',
        cardTitle: caption ? caption.slice(0, 80) : file.name,
      });
      if (res.ok && res.id) {
        const urls = shareUrls(res.id);
        setShare({ id: res.id, url: urls.app });
        try { await navigator.clipboard.writeText(urls.app); } catch {}
      } else {
        setWarn(res.error || 'drop failed');
      }
    } catch (e: any) {
      setWarn(e?.message || 'drop failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 110, damping: 18 }}
          className="glass rounded-[36px] p-8 sm:p-10"
        >
          <p className="text-[#0A84FF] text-sm font-medium mb-2 tracking-wide">grok drop</p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-3">drop with a note.</h1>
          <p className="text-neutral-400 text-sm mb-8 leading-relaxed">
            One local file, a short note, a professional Discord embed. Springy motion, human-crafted feel. Large files warned, never blocked.
          </p>

          <label
            className="block cursor-pointer rounded-[28px] border border-dashed border-white/12 hover:border-[#0A84FF]/40 p-10 text-center transition mb-6"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onSelect(e.dataTransfer.files); }}
          >
            <input type="file" className="hidden" onChange={(e) => onSelect(e.target.files)} />
            <p className="text-white font-medium">{file ? file.name : 'click or drop a file'}</p>
            <p className="text-xs text-neutral-500 mt-2">{file ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : 'no size limits · only slowness warnings'}</p>
          </label>

          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="optional note (becomes the embed title)"
            className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-neutral-500 outline-none focus:border-[#0A84FF]/40 mb-6"
          />

          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={!file || busy}
            onClick={send}
            className="w-full py-3.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40 transition"
          >
            {busy ? 'dropping…' : 'drop it'}
          </motion.button>

          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}

          <AnimatePresence>
            {share && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-8 rounded-2xl bg-white/5 border border-white/10 p-5"
              >
                <p className="text-xs text-neutral-400 mb-2">share ready (copied)</p>
                <p className="text-sm break-all text-neutral-200 mb-4">{share.url}</p>
                <div className="flex gap-2">
                  <button onClick={() => navigate('share', share.id)} className="px-4 py-2 rounded-full bg-[#0A84FF] text-white text-xs font-medium">open share</button>
                  <button onClick={() => navigate('vault')} className="px-4 py-2 rounded-full glass text-xs">vault</button>
                </div>
                <p className="text-[11px] text-neutral-500 mt-3">Discord will show a pro card on this link.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
