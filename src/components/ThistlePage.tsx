import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { publishShare, shareUrls } from '../lib/cloudShare';

export default function ThistlePage() {
  const { navigate } = useRouter();
  const [urls, setUrls] = useState('');
  const [title, setTitle] = useState('thistle pack');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [id, setId] = useState('');
  const [embed, setEmbed] = useState('');

  const publish = async () => {
    const list = urls
      .split(/\n|,/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!list.length) return;
    setBusy(true);
    setErr('');
    try {
      const nid = 'thistle-' + Date.now().toString(36);
      const body = JSON.stringify({ kind: 'thistle', title: title.trim() || 'thistle pack', links: list, at: new Date().toISOString() }, null, 2);
      const file = new File([body], 'thistle.json', { type: 'application/json' });
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ''));
        r.onerror = () => reject(new Error('encode failed'));
        r.readAsDataURL(file);
      });
      const res = await publishShare({
        id: nid,
        name: file.name,
        type: 'application/json',
        size: file.size,
        dataUrl,
      });
      if (!res.ok) {
        setErr(res.error || 'cloud publish failed');
        return;
      }
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
          <p className="text-[#0a84ff] text-sm mb-2">thistle</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">bundle links, not files.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            a desk for collecting urls into one json card in the share db. discord still gets a clean /s/ unfurl.
          </p>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full mb-3 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none"
          />
          <textarea
            value={urls}
            onChange={(e) => setUrls(e.target.value)}
            placeholder={'one url per line\nhttps://…'}
            rows={8}
            className="w-full mb-4 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none resize-y"
          />
          <button
            onClick={publish}
            disabled={busy || !urls.trim()}
            className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40"
          >
            {busy ? 'tying…' : 'publish thistle'}
          </button>
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
