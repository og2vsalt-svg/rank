import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function toDataUrl(text: string) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  return new Promise<{ dataUrl: string; size: number }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('encode failed'));
    reader.onload = () => resolve({ dataUrl: String(reader.result), size: blob.size });
    reader.readAsDataURL(blob);
  });
}

export default function SlatePage() {
  const { navigate } = useRouter();
  const [text, setText] = useState('');
  const [name, setName] = useState('note.txt');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [id, setId] = useState<string | null>(null);
  const [link, setLink] = useState('');
  const [embed, setEmbed] = useState('');

  const publish = async () => {
    const body = text.trim();
    if (!body) {
      setErr('paste something first');
      return;
    }
    setBusy(true);
    setErr('');
    setWarn('');
    try {
      const fileId = uid();
      const encoded = await toDataUrl(body);
      if (encoded.size > 40 * 1024 * 1024) {
        setWarn('huge paste. the tab might hitch while it uploads. no hard cap.');
      }
      const res = await publishShare({
        id: fileId,
        name: (name || 'note.txt').slice(0, 180),
        type: 'text/plain',
        size: encoded.size,
        dataUrl: encoded.dataUrl,
      });
      if (!res.ok) {
        setErr(res.error || 'publish failed');
        return;
      }
      if (res.warn) setWarn(res.warn);
      setId(fileId);
      const urls = shareUrls(fileId);
      setLink(urls.app);
      setEmbed(urls.embed);
      try {
        await navigator.clipboard.writeText(urls.embed);
      } catch {}
    } catch (e: any) {
      setErr(e?.message || 'could not publish');
    } finally {
      setBusy(false);
    }
  };

  const grabClipboard = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) setText(clip);
      else setErr('clipboard was empty');
    } catch {
      setErr('browser blocked clipboard read. just paste in the box.');
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">slate</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">paste text. get a discord-ready link.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            not the vault. this dumps a local note into the public shares table and hands you an embed url.
          </p>
          <div className="flex gap-2 mb-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-sm outline-none focus:border-[#0a84ff]/50 transition-colors"
              placeholder="filename"
            />
            <button
              onClick={grabClipboard}
              className="px-4 py-2.5 rounded-2xl bg-white/5 text-sm text-neutral-300 hover:bg-white/10 transition-colors"
            >
              grab clipboard
            </button>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={12}
            className="w-full bg-white/[0.04] border border-white/10 rounded-[22px] px-4 py-3 text-sm leading-relaxed outline-none focus:border-[#0a84ff]/40 transition-colors resize-y min-h-[220px]"
            placeholder="drop words here…"
          />
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={publish}
              disabled={busy}
              className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-200 disabled:opacity-50 transition-colors"
            >
              {busy ? 'publishing…' : 'publish share'}
            </button>
            <p className="text-xs text-neutral-500">{text.length.toLocaleString()} chars. no size cap, just a slowness warning.</p>
          </div>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {id && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 space-y-2"
            >
              <p className="text-xs text-neutral-400 break-all">app: {link}</p>
              <p className="text-xs text-neutral-400 break-all">discord embed (copied): {embed}</p>
              <div className="flex flex-wrap gap-2 pt-1">
                <button onClick={() => navigate('share', id)} className="px-4 py-2 rounded-full bg-white/8 text-sm">
                  open share
                </button>
                <button onClick={() => navigate('drop')} className="px-4 py-2 rounded-full bg-white/8 text-sm">
                  file drop instead
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
