import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function pretty(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('could not read file'));
    r.readAsDataURL(file);
  });
}

function noteToFile(text: string) {
  const blob = new Blob([text], { type: 'text/plain' });
  return new File([blob], 'sluice-note.txt', { type: 'text/plain' });
}

export default function SluicePage() {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [meta, setMeta] = useState<{ name: string; size: number; type: string } | null>(null);
  const [embed, setEmbed] = useState('');
  const [app, setApp] = useState('');

  const publish = async (file: File) => {
    setErr('');
    setEmbed('');
    setApp('');
    setMeta({ name: file.name, size: file.size, type: file.type || 'application/octet-stream' });
    setWarn(file.size > 32 * 1024 * 1024 ? 'no cap. a file this heavy can make the tab feel slow.' : '');
    setBusy(true);
    try {
      const dataUrl = await readAsDataUrl(file);
      const id = uid();
      const res = await publishShare({
        id,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
        author: 'sluice',
      });
      if (!res.ok) throw new Error(res.error || 'sluice failed');
      const urls = shareUrls(res.id || id);
      setEmbed(urls.embed);
      setApp(urls.app);
      if (res.warn) setWarn(res.warn);
      try {
        await navigator.clipboard.writeText(urls.embed);
      } catch {}
    } catch (e: any) {
      setErr(e?.message || 'sluice failed');
    } finally {
      setBusy(false);
    }
  };

  const fromClipboard = async () => {
    setErr('');
    try {
      if (navigator.clipboard && 'read' in navigator.clipboard) {
        const items = await (navigator.clipboard as any).read();
        for (const item of items) {
          const type = item.types.find((t: string) => t.startsWith('image/') || t === 'text/plain');
          if (!type) continue;
          const blob = await item.getType(type);
          if (type.startsWith('image/')) {
            const file = new File([blob], `sluice.${type.split('/')[1] || 'png'}`, { type });
            await publish(file);
            return;
          }
          const text = await blob.text();
          if (text.trim()) {
            await publish(noteToFile(text));
            return;
          }
        }
      }
      const text = await navigator.clipboard.readText();
      if (!text.trim()) throw new Error('clipboard is empty');
      await publish(noteToFile(text));
    } catch (e: any) {
      setErr(e?.message || 'clipboard blocked');
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
          <p className="text-[#0a84ff] text-sm mb-2">sluice</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">pour the clipboard, or a local file, into the share db.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            not the vault. a note or a file becomes a public drop. discord unfurls the /s card. no hard size cap — only a slowness warning.
          </p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={6}
            placeholder="paste a note, then open the gate"
            className="w-full mb-4 bg-white/5 border border-white/10 rounded-3xl px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/40 resize-none"
          />
          <div className="flex flex-wrap gap-2 mb-5">
            <button
              disabled={busy || !note.trim()}
              onClick={() => publish(noteToFile(note))}
              className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40"
            >
              {busy ? 'opening the gate…' : 'publish note'}
            </button>
            <button
              disabled={busy}
              onClick={fromClipboard}
              className="px-4 py-2 rounded-full bg-white/8 border border-white/10 text-sm text-neutral-200 disabled:opacity-40"
            >
              from clipboard
            </button>
          </div>
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition-all duration-300"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) publish(f);
            }}
          >
            <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && publish(e.target.files[0])} />
            <p className="text-white font-medium">{busy ? 'crossing…' : 'drop a local file through the sluice'}</p>
            <p className="text-xs text-neutral-500 mt-2">the discord embed link copies itself.</p>
          </label>
          {meta && (
            <p className="text-xs text-neutral-500 mt-4">
              {meta.name} · {pretty(meta.size)} · {meta.type}
            </p>
          )}
          {warn && <p className="text-xs text-amber-300/90 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {embed && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-2 text-xs text-neutral-400 break-all">
              <p>discord (copied): {embed}</p>
              <p>app: {app}</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
