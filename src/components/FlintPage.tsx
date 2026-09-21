import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { publishShare, shareUrls } from '../lib/cloudShare';

function formatBytes(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  return (n / (1024 * 1024)).toFixed(2) + ' mb';
}

export default function FlintPage() {
  const { navigate } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [embed, setEmbed] = useState('');

  const pick = (f: File | null) => {
    setFile(f);
    setErr('');
    setLink('');
    setEmbed('');
    if (!f) {
      setWarn('');
      return;
    }
    setWarn(
      f.size > 20 * 1024 * 1024
        ? 'heavy file. no cap, but the browser and host can feel slow.'
        : f.size > 8 * 1024 * 1024
          ? 'decent size. upload may take a beat.'
          : '',
    );
  };

  const send = async () => {
    if (!file) return;
    setBusy(true);
    setErr('');
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ''));
        r.onerror = () => reject(new Error('could not read file'));
        r.readAsDataURL(file);
      });
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const res = await publishShare({
        id,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
      });
      if (!res.ok) {
        setErr(res.error || 'could not land this in the share db');
        return;
      }
      const urls = shareUrls(res.id || id);
      setLink(urls.app);
      setEmbed(urls.embed);
      if (res.warn) setWarn(res.warn);
    } catch (e: any) {
      setErr(e?.message || 'upload failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">flint</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">spark a public drop from a local file.</h1>
          <p className="text-neutral-400 text-sm mb-6">lands in the share database. discord picks up the /s/ link with a proper embed. no hard size cap.</p>
          <label className="block rounded-2xl border border-dashed border-white/15 px-5 py-12 text-center text-sm text-neutral-400 cursor-pointer hover:border-white/30 transition-colors mb-5">
            {file ? `${file.name} · ${formatBytes(file.size)}` : 'pick a local file'}
            <input type="file" className="hidden" onChange={(e) => pick(e.target.files?.[0] || null)} />
          </label>
          {warn && <p className="text-xs text-amber-400/90 mb-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mb-4">{err}</p>}
          <button
            disabled={!file || busy}
            onClick={send}
            className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40"
          >
            {busy ? 'sending…' : 'publish drop'}
          </button>
          {link && (
            <div className="mt-6 space-y-2 text-sm">
              <p className="text-neutral-500">app link</p>
              <button onClick={() => navigator.clipboard.writeText(link)} className="block w-full text-left text-[#0a84ff] truncate">{link}</button>
              <p className="text-neutral-500 pt-2">discord embed link</p>
              <button onClick={() => navigator.clipboard.writeText(embed)} className="block w-full text-left text-[#0a84ff] truncate">{embed}</button>
              <button onClick={() => navigate('share', (embed.split('/s/')[1] || ''))} className="mt-3 px-4 py-2 rounded-full bg-white/5 text-sm">open share page</button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
