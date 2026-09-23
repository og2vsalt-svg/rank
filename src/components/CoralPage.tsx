import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

export default function CoralPage() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [embed, setEmbed] = useState('');
  const [warn, setWarn] = useState('');

  const go = async () => {
    if (!file) return;
    setBusy(true);
    setMsg('');
    setWarn('');
    try {
      if (file.size > 25 * 1024 * 1024) {
        setWarn('chunky file. upload still goes through, tab might lag a bit.');
      }
      const dataUrl = await readFile(file);
      const id = uid();
      const res = await publishShare({
        id,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
      });
      if (!res.ok) {
        setMsg(res.error || 'share table said no');
      } else {
        const urls = shareUrls(res.id || id);
        setEmbed(urls.embed);
        setMsg('landed in the db. discord will unfurl the /s link.');
        if (res.warn) setWarn(res.warn);
      }
    } catch (e: any) {
      setMsg(e?.message || 'could not read file');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">coral</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">file to the share table.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            pick a local file. it goes straight into supabase (blob when the token exists). no vault detour. no hard size cap.
          </p>
          <label className="block rounded-3xl border border-dashed border-white/15 bg-white/[0.03] px-5 py-10 text-center cursor-pointer hover:border-[#0a84ff]/40 transition-colors">
            <input
              type="file"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <p className="text-sm text-white">{file ? file.name : 'drop or pick a file'}</p>
            {file && (
              <p className="text-xs text-neutral-500 mt-1">
                {(file.size / (1024 * 1024)).toFixed(2)} mb · {file.type || 'unknown'}
              </p>
            )}
          </label>
          {warn && <p className="text-amber-300/90 text-xs mt-4">{warn}</p>}
          <button
            disabled={!file || busy}
            onClick={go}
            className="mt-5 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40"
          >
            {busy ? 'sending…' : 'publish drop'}
          </button>
          {msg && <p className="text-sm text-neutral-400 mt-4">{msg}</p>}
          {embed && (
            <div className="mt-4 flex flex-wrap gap-2">
              <code className="text-xs text-neutral-400 break-all">{embed}</code>
              <button
                onClick={() => navigator.clipboard.writeText(embed)}
                className="text-[12px] px-3 py-1.5 rounded-full bg-white/8"
              >
                copy discord link
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
