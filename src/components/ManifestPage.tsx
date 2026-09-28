import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { shareUrls } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(1) + ' mb';
}

async function sha256(file: File) {
  const buf = await file.arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function ManifestPage() {
  const [rows, setRows] = useState<{ name: string; size: number; type: string; hash: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [embed, setEmbed] = useState('');
  const [warn, setWarn] = useState('');

  const catalog = async (list: FileList | File[] | undefined) => {
    const arr = Array.from(list || []);
    if (!arr.length) return;
    setErr('');
    setBusy(true);
    try {
      const next = [];
      for (const file of arr) {
        next.push({
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          hash: await sha256(file),
        });
      }
      setRows(next);
    } catch (e: any) {
      setErr(e?.message || 'could not read pile');
    } finally {
      setBusy(false);
    }
  };

  const publish = async () => {
    if (!rows.length) return;
    setBusy(true);
    setErr('');
    try {
      const body = JSON.stringify({ generatedAt: new Date().toISOString(), files: rows }, null, 2);
      const file = new File([body], 'manifest.json', { type: 'application/json' });
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ''));
        r.onerror = () => reject(new Error('encode failed'));
        r.readAsDataURL(file);
      });
      const r = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: file.name, type: file.type, size: file.size, dataUrl }),
      });
      const json = await r.json();
      if (!r.ok || !json?.ok) throw new Error(json?.error || 'share failed');
      const urls = shareUrls(json.id);
      setLink(urls.app);
      setEmbed(urls.embed || `${window.location.origin}/s/${json.id}`);
      setWarn(json.warn || '');
      try { await navigator.clipboard.writeText(urls.embed || urls.app); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'manifest failed');
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
          <p className="text-[#0a84ff] text-sm mb-2">manifest</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">hash a pile, publish the list.</h1>
          <p className="text-neutral-400 text-sm mb-6">bytes stay on this machine. only the names, sizes, and sha-256 leave as a public json drop.</p>
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); catalog(e.dataTransfer.files); }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => catalog(e.target.files || undefined)} />
            <p className="text-white font-medium">{busy ? 'weighing…' : 'drop a pile'}</p>
            <p className="text-xs text-neutral-500 mt-2">no hard limit. hashing a huge pile can feel slow.</p>
          </label>
          {rows.length > 0 && (
            <ul className="mt-5 space-y-2 text-xs text-neutral-400">
              {rows.map((row) => (
                <li key={row.hash} className="break-all">
                  {row.name} · {pretty(row.size)} · {row.hash.slice(0, 16)}…
                </li>
              ))}
            </ul>
          )}
          {rows.length > 0 && (
            <button onClick={publish} disabled={busy} className="mt-6 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-200 disabled:opacity-50">
              publish manifest
            </button>
          )}
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {embed && (
            <div className="mt-6 space-y-2">
              <p className="text-xs text-neutral-400 break-all">discord: {embed}</p>
              <p className="text-xs text-neutral-500 break-all">app: {link}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
