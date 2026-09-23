import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { publishShare } from '../lib/cloudShare';

function hex(buf: ArrayBuffer) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function FenPage() {
  const { navigate } = useRouter();
  const [info, setInfo] = useState<{ name: string; mime: string; size: number; sha: string } | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState('');

  const onFile = async (list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    setFile(f);
    setErr('');
    setLink('');
    setWarn(f.size > 12 * 1024 * 1024 ? 'chunky file. hashing still runs, just may hitch. no hard limit.' : '');
    const buf = await f.arrayBuffer();
    const sha = hex(await crypto.subtle.digest('SHA-256', buf));
    setInfo({ name: f.name, mime: f.type || 'application/octet-stream', size: f.size, sha });
  };

  const publish = async () => {
    if (!file) return;
    setBusy(true);
    setErr('');
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = () => reject(r.error);
        r.readAsDataURL(file);
      });
      const id = crypto.randomUUID().slice(0, 10);
      const res = await publishShare({
        id,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
      });
      if (!res.ok) throw new Error(res.error || 'publish failed');
      const origin = window.location.origin;
      setLink(`${origin}/s/${res.id || id}`);
    } catch (e: any) {
      setErr(e?.message || 'could not publish');
    } finally {
      setBusy(false);
    }
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
          <p className="text-[#0a84ff] text-sm mb-2">fen</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">read the file, then share it.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            local metadata desk. sha-256, mime, size. optional publish to the share db with a discord-ready /s link.
          </p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition">
            <input type="file" className="hidden" onChange={(e) => onFile(e.target.files)} />
            <p className="text-white font-medium">drop a local file</p>
            <p className="text-xs text-neutral-500 mt-2">no file limit. just a slowness ping if it is huge.</p>
          </label>
          {info && (
            <div className="mt-5 space-y-2 rounded-2xl bg-black/30 p-4 text-sm">
              <p className="text-white">{info.name}</p>
              <p className="text-neutral-400 text-xs">{info.mime} · {(info.size / 1024).toFixed(1)} kb</p>
              <p className="text-[11px] font-mono break-all text-neutral-500">{info.sha}</p>
            </div>
          )}
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {file && (
            <button
              onClick={publish}
              disabled={busy}
              className="mt-6 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50"
            >
              {busy ? 'publishing…' : 'publish share'}
            </button>
          )}
          {link && (
            <div className="mt-6 space-y-3">
              <p className="text-xs text-neutral-500">discord embed url</p>
              <p className="text-sm break-all text-white">{link}</p>
              <div className="flex gap-2">
                <button onClick={() => navigator.clipboard.writeText(link)} className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium">copy</button>
                <button onClick={() => navigate('share', link.split('/').pop())} className="px-4 py-2 rounded-full bg-white/10 text-sm">open drop</button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
