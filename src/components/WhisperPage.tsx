import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { shareUrls } from '../lib/cloudShare';

async function wrap(text: string, pass: string) {
  const enc = new TextEncoder();
  const keyMat = await crypto.subtle.digest('SHA-256', enc.encode(pass || 'rankvault'));
  const key = await crypto.subtle.importKey('raw', keyMat, { name: 'AES-GCM' }, false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(text));
  const out = new Uint8Array(iv.length + new Uint8Array(cipher).length);
  out.set(iv, 0);
  out.set(new Uint8Array(cipher), iv.length);
  let bin = '';
  out.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin);
}

export default function WhisperPage() {
  const [note, setNote] = useState('');
  const [pass, setPass] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [embed, setEmbed] = useState('');

  const send = async () => {
    if (!note.trim()) return;
    setBusy(true);
    setErr('');
    try {
      const sealed = await wrap(note, pass);
      const body = JSON.stringify({
        kind: 'rankvault-whisper',
        hint: pass ? 'aes-gcm with the phrase you set' : 'aes-gcm with default desk phrase',
        payload: sealed,
      }, null, 2);
      const file = new File([body], 'whisper.json', { type: 'application/json' });
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
      try { await navigator.clipboard.writeText(urls.embed || urls.app); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'whisper failed');
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
          <p className="text-[#0a84ff] text-sm mb-2">whisper</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">seal a note, then leave it in public.</h1>
          <p className="text-neutral-400 text-sm mb-6">aes-gcm in the tab. the share db only sees ciphertext. not another vault grid.</p>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={7} placeholder="quiet words" className="w-full mb-4 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-[#0a84ff]/50 resize-y" />
          <input value={pass} onChange={(e) => setPass(e.target.value)} placeholder="optional phrase" className="w-full mb-6 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-[#0a84ff]/50" />
          <button onClick={send} disabled={busy || !note.trim()} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-200 disabled:opacity-50">
            {busy ? 'sealing…' : 'publish sealed note'}
          </button>
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
