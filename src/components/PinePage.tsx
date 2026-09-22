import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { publishShare, shareUrls } from '../lib/cloudShare';

function nid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function PinePage() {
  const { navigate } = useRouter();
  const [label, setLabel] = useState('send me this file');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [id, setId] = useState('');

  const preview = useMemo(
    () => ({
      title: label.trim() || 'file request',
      body: note.trim() || 'drop a local file into this request. it lands in the public share db.',
    }),
    [label, note],
  );

  const make = async () => {
    setBusy(true);
    setErr('');
    try {
      const idv = 'req-' + nid();
      const text = `${preview.title}\n\n${preview.body}\n\nthis is a request stub. replace it by uploading on pebble or drop.`;
      const dataUrl = 'data:text/plain;base64,' + btoa(unescape(encodeURIComponent(text)));
      const res = await publishShare({
        id: idv,
        name: preview.title + '.txt',
        type: 'text/plain',
        size: text.length,
        dataUrl,
      });
      if (!res.ok) {
        setErr(res.error || 'could not publish request');
        return;
      }
      const urls = shareUrls(res.id || idv);
      setId(res.id || idv);
      setLink(urls.embed);
    } catch (e: any) {
      setErr(e?.message || 'request failed');
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
          <p className="text-[#0a84ff] text-sm mb-2">pine</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">ask for a file.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            not a vault. mint a quiet request card, drop the /s/ link in discord, and they can reply with a pebble upload.
          </p>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="what do you need"
            className="w-full mb-3 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none"
          />
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="optional note"
            rows={4}
            className="w-full mb-4 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none resize-none"
          />
          <button
            onClick={make}
            disabled={busy}
            className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50"
          >
            {busy ? 'minting…' : 'mint request'}
          </button>
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {link && (
            <div className="mt-6 space-y-3">
              <p className="text-xs text-neutral-500">discord embed</p>
              <p className="text-sm break-all text-white">{link}</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => navigator.clipboard.writeText(link)} className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium">copy embed</button>
                <button onClick={() => navigate('share', id)} className="px-4 py-2 rounded-full bg-white/10 text-sm">open drop</button>
                <button onClick={() => navigate('pebble')} className="px-4 py-2 rounded-full bg-white/10 text-sm">reply with pebble</button>
              </div>
              <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#2b2d31]">
                <div className="h-1 bg-[#0a84ff]" />
                <div className="p-4">
                  <p className="text-[#00a8fc] text-sm font-medium">rankvault</p>
                  <p className="text-white text-base mt-1">{preview.title} — rankvault</p>
                  <p className="text-[#dbdee1] text-sm mt-1">{preview.body}</p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
