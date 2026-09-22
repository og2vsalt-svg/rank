import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { publishShare, shareUrls } from '../lib/cloudShare';

export default function LagoonPage() {
  const { navigate } = useRouter();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [id, setId] = useState('');
  const [embed, setEmbed] = useState('');
  const bytes = useMemo(() => new TextEncoder().encode(text).length, [text]);

  const publish = async () => {
    if (!text.trim()) return;
    setBusy(true);
    setErr('');
    setWarn(bytes > 2_000_000 ? 'deep water. this paste is chunky so the tab may stall. no hard cap.' : '');
    try {
      const nid = 'lagoon-' + Date.now().toString(36);
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const file = new File([blob], 'lagoon.txt', { type: 'text/plain' });
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ''));
        r.onerror = () => reject(new Error('encode failed'));
        r.readAsDataURL(file);
      });
      const res = await publishShare({
        id: nid,
        name: file.name,
        type: 'text/plain',
        size: file.size,
        dataUrl,
      });
      if (!res.ok) {
        setErr(res.error || 'cloud publish failed');
        return;
      }
      if (res.warn) setWarn(res.warn);
      setId(res.id || nid);
      setEmbed(shareUrls(res.id || nid).embed);
    } catch (e: any) {
      setErr(e?.message || 'publish failed');
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
          <p className="text-[#0a84ff] text-sm mb-2">lagoon</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">pour text into the tide.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            not a vault. a still pool for a long note that lands in public_shares so discord can unfurl it.
          </p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="write anything. we do not cap it."
            rows={10}
            className="w-full mb-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none resize-y min-h-[180px]"
          />
          <p className="text-[11px] text-neutral-500 mb-4">{bytes.toLocaleString()} bytes</p>
          <button
            onClick={publish}
            disabled={busy || !text.trim()}
            className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40"
          >
            {busy ? 'pouring…' : 'publish pool'}
          </button>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {id && (
            <div className="mt-6 space-y-3">
              <p className="text-xs text-neutral-500">discord embed</p>
              <p className="text-sm break-all text-white">{embed}</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => navigator.clipboard.writeText(embed)} className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium">copy embed</button>
                <button onClick={() => navigate('share', id)} className="px-4 py-2 rounded-full bg-white/10 text-sm">open drop</button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
