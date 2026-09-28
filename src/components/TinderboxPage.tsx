import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { shareUrls } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('could not read file'));
    r.readAsDataURL(file);
  });
}

export default function TinderboxPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');
  const [app, setApp] = useState('');
  const [copied, setCopied] = useState(false);

  const pick = (f?: File) => {
    if (!f) return;
    setFile(f);
    setErr('');
    setEmbed('');
    setApp('');
    setWarn(f.size > 40 * 1024 * 1024 ? 'no size lock. large files just make this tab slower while they encode.' : '');
    if (f.type.startsWith('image/')) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview('');
    }
  };

  const light = async () => {
    if (!file) return;
    setBusy(true);
    setErr('');
    try {
      const dataUrl = await readAsDataUrl(file);
      const r = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl,
        }),
      });
      const json = await r.json();
      if (!r.ok || !json?.ok) throw new Error(json?.error || 'share failed');
      const urls = shareUrls(json.id);
      setEmbed(urls.embed);
      setApp(urls.app);
      try {
        await navigator.clipboard.writeText(urls.embed);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      } catch {}
      if (json.warn) setWarn(json.warn);
    } catch (e: any) {
      setErr(e?.message || 'tinderbox failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">tinderbox</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">preview the discord card, then light the drop.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            not a vault. pick a local file, see how it will unfurl in discord, then send bytes into the public share table. no hard cap — only a slowness note.
          </p>

          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition mb-6">
            <input
              type="file"
              className="hidden"
              onChange={(e) => pick(e.target.files?.[0])}
            />
            <span className="text-sm text-neutral-300">{file ? file.name : 'choose a file'}</span>
            {file && <span className="block text-xs text-neutral-500 mt-2">{pretty(file.size)} · {file.type || 'unknown'}</span>}
          </label>

          {file && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl overflow-hidden border border-white/10 bg-[#111214] mb-6"
            >
              <div className="flex items-stretch">
                <div className="w-1 bg-[#0A84FF]" />
                <div className="flex-1 p-4">
                  <p className="text-xs text-[#0A84FF] mb-1">rankvault</p>
                  <p className="text-[15px] font-semibold text-white leading-tight">{file.name}</p>
                  <p className="text-sm text-[#b5bac1] mt-1">
                    {(file.type || 'file').split(';')[0]} · {pretty(file.size)} · public drop on rankvault
                  </p>
                  {preview && (
                    <img src={preview} alt="" className="mt-3 rounded-lg max-h-48 object-cover w-full" />
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {warn && <p className="text-amber-300/90 text-xs mb-4">{warn}</p>}
          {err && <p className="text-red-400 text-xs mb-4">{err}</p>}

          <div className="flex flex-wrap gap-3">
            <button
              disabled={!file || busy}
              onClick={light}
              className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40"
            >
              {busy ? 'lighting…' : 'light drop'}
            </button>
          </div>

          {embed && (
            <div className="mt-6 space-y-2">
              <p className="text-xs text-neutral-500">discord unfurl link {copied ? '· copied' : ''}</p>
              <p className="text-sm break-all text-[#0a84ff]">{embed}</p>
              {app && <p className="text-xs break-all text-neutral-500">{app}</p>}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
