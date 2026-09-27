import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function KindlingPage() {
  const { navigate } = useRouter();
  const [title, setTitle] = useState('untitled note');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState('');
  const [warn, setWarn] = useState('');

  const publish = async () => {
    const text = body.trim();
    if (!text) return;
    setBusy(true);
    setWarn('');
    try {
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ''));
        r.onerror = () => reject(new Error('read failed'));
        r.readAsDataURL(blob);
      });
      const id = uid();
      const name = (title.trim() || 'note') + '.txt';
      const res = await publishShare({
        id,
        name,
        type: 'text/plain',
        size: blob.size,
        dataUrl,
      });
      if (!res.ok) {
        setWarn(res.error || 'could not publish');
        return;
      }
      setWarn(res.warn || '');
      setLink(shareUrls(id).embed);
      navigate('share', id);
    } catch (e: any) {
      setWarn(e?.message || 'could not publish');
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
          <p className="text-[#0a84ff] text-sm mb-2">kindling</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">write a note. light it as a public file.</h1>
          <p className="text-neutral-400 text-sm mb-6">not the vault. just a scrap of text that becomes a share with a discord card.</p>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full mb-3 bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-[#0a84ff]/50"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={10}
            placeholder="type anything"
            className="w-full mb-4 bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-[#0a84ff]/50 resize-y min-h-[180px]"
          />
          <button
            onClick={publish}
            disabled={busy || !body.trim()}
            className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40"
          >
            {busy ? 'lighting…' : 'publish note'}
          </button>
          {warn && <p className="text-sm text-amber-200/80 mt-4">{warn}</p>}
          {link && <p className="text-[12px] text-neutral-500 mt-3 break-all">{link}</p>}
        </motion.div>
      </div>
    </div>
  );
}
