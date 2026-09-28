import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('could not read file'));
    r.readAsDataURL(file);
  });
}

export default function PostcardPage() {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [urls, setUrls] = useState<{ app: string; embed: string } | null>(null);
  const [copied, setCopied] = useState('');

  const send = async () => {
    if (!file) {
      setErr('drop a file first');
      return;
    }
    setErr('');
    setWarn(file.size > 25 * 1024 * 1024 ? 'big postcard. no cap, just a slowness ping while we encode.' : '');
    setBusy(true);
    try {
      const dataUrl = await readAsDataUrl(file);
      const id = crypto.randomUUID().slice(0, 10);
      const name = caption.trim() ? `${caption.trim()} — ${file.name}` : file.name;
      const res = await publishShare({
        id,
        name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
      });
      if (!res.ok) {
        setErr(res.error || 'could not send postcard');
        return;
      }
      setUrls(shareUrls(res.id || id));
    } catch (e: any) {
      setErr(e?.message || 'failed');
    } finally {
      setBusy(false);
    }
  };

  const copy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 1400);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-24 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[13px] text-[#0a84ff] mb-3">postcard</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mb-3">a share that looks good in discord</h1>
          <p className="text-neutral-400 mb-8 max-w-xl">uploads the local file to the public shares db and gives you the /s/ embed url discord actually unfurls.</p>
          <label className="block rounded-3xl border border-dashed border-white/15 bg-white/[0.03] p-8 text-center cursor-pointer hover:bg-white/[0.05] transition-colors">
            <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <p className="text-white">{file ? file.name : 'drop a file or click to pick'}</p>
            <p className="text-xs text-neutral-500 mt-2">no hard limit. we only warn when it might feel slow.</p>
          </label>
          <input value={caption} onChange={(e) => setCaption(e.target.value)} className="mt-4 w-full bg-white/5 rounded-2xl px-4 py-3 text-sm outline-none" placeholder="optional caption for the embed title" />
          <button onClick={send} disabled={busy} className="mt-4 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50">
            {busy ? 'sending…' : 'make postcard'}
          </button>
          {warn && <p className="text-xs text-amber-300 mt-3">{warn}</p>}
          {err && <p className="text-xs text-rose-300 mt-3">{err}</p>}
          {urls && (
            <div className="mt-6 rounded-3xl bg-white/[0.04] border border-white/8 p-5 space-y-3">
              <p className="text-sm text-neutral-300 break-all">{urls.embed}</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => copy(urls.embed, 'embed')} className="px-4 py-2 rounded-full bg-white/10 text-sm">copy discord link</button>
                <button onClick={() => copy(urls.app, 'app')} className="px-4 py-2 rounded-full bg-white/10 text-sm">copy app link</button>
              </div>
              {copied && <p className="text-xs text-[#0a84ff]">copied {copied}</p>}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
