import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useVault } from './VaultContext';
import { useRouter } from './Router';
import Navbar from './Navbar';

export default function ShareHubPage() {
  const { addFiles } = useVault();
  const { navigate } = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [warning, setWarning] = useState('');

  const handleFiles = (list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list);
    setFiles(arr);
    const total = arr.reduce((s, f) => s + f.size, 0);
    if (total > 50 * 1024 * 1024) {
      setWarning('Large drop detected. Upload may feel slow on this device, but no hard limit.');
    } else {
      setWarning('');
    }
  };

  const uploadAndShare = async () => {
    if (!files.length) return;
    setBusy(true);
    const res = await addFiles(files, 'shared');
    setBusy(false);
    if (res.ok && res.ids && res.ids[0]) {
      const url = `${window.location.origin}/#share?f=${res.ids[0]}`;
      setShareLink(url);
      try { await navigator.clipboard.writeText(url); } catch {}
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0a84ff] text-sm font-medium mb-3 tracking-wide">share hub</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mb-4">upload once. share anywhere.</h1>
          <p className="text-neutral-400 text-lg mb-8 leading-relaxed">Drop local files. Get a pro Discord embed link instantly. No size refusals — only gentle speed notes.</p>
        </motion.div>

        <div
          onDragOver={(e) => { e.preventDefault(); }}
          onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
          className="glass rounded-3xl p-10 text-center apple-card mb-6 cursor-pointer"
          onClick={() => fileRef.current?.click()}
        >
          <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
          <div className="text-5xl mb-4 opacity-80">📁</div>
          <p className="text-white font-medium mb-2">Drop files here or click to browse</p>
          <p className="text-sm text-neutral-500">Images, docs, anything. Stored locally + shareable.</p>
          {files.length > 0 && <p className="mt-4 text-sm text-[#0a84ff]">{files.length} file{files.length > 1 ? 's' : ''} ready</p>}
        </div>

        {warning && <p className="text-amber-300 text-sm mb-4 text-center">{warning}</p>}

        <div className="flex justify-center gap-3 mb-8">
          <button
            onClick={uploadAndShare}
            disabled={!files.length || busy}
            className="px-6 py-3 rounded-full bg-white text-black font-medium disabled:opacity-50 active:scale-95 transition"
          >
            {busy ? 'uploading…' : 'upload & share'}
          </button>
          <button onClick={() => navigate('vault')} className="px-6 py-3 rounded-full glass text-white">open vault</button>
        </div>

        {shareLink && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass rounded-2xl p-5 text-center">
            <p className="text-sm text-neutral-400 mb-2">link copied — paste in Discord for a rich embed</p>
            <code className="text-xs text-[#0a84ff] break-all">{shareLink}</code>
          </motion.div>
        )}
      </div>
    </div>
  );
}
