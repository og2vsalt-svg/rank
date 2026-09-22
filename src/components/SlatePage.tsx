import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { useRouter } from './Router';
import { publishShare, shareUrls } from '../lib/cloudShare';

export default function SlatePage() {
  const { addFiles } = useVault();
  const { navigate } = useRouter();
  const [title, setTitle] = useState('untitled slate');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [id, setId] = useState<string | null>(null);
  const [embed, setEmbed] = useState('');

  const publish = async () => {
    setErr('');
    setBusy(true);
    try {
      const text = body || '';
      const blob = new Blob([text], { type: 'text/plain' });
      const file = new File([blob], `${title.replace(/[^a-z0-9._-]+/gi, '-') || 'slate'}.txt`, { type: 'text/plain' });
      if (file.size > 8 * 1024 * 1024) setWarn('long slate. preview clients may crawl. no hard cap.');
      const dt = new DataTransfer();
      dt.items.add(file);
      const saved = await addFiles(dt.files, 'inbox');
      const newId = saved.ids?.[0] || Date.now().toString(36);
      const reader = new FileReader();
      const dataUrl: string = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      const pub = await publishShare({
        id: newId,
        name: file.name,
        type: 'text/plain',
        size: file.size,
        dataUrl,
      });
      if (!pub.ok) {
        setErr(pub.error || 'could not publish slate');
        return;
      }
      setId(newId);
      setEmbed(shareUrls(newId).embed);
      if (pub.warn) setWarn(pub.warn);
    } catch (e: any) {
      setErr(e?.message || 'slate failed');
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
          <p className="text-[#0a84ff] text-sm mb-2">slate</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">host a text dump.</h1>
          <p className="text-neutral-400 text-sm mb-6">not the vault ui. just raw text that becomes a public file + discord embed.</p>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full mb-3 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none"
            placeholder="title"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={12}
            className="w-full mb-4 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none resize-y"
            placeholder="paste anything. logs, notes, dumps."
          />
          <button
            onClick={publish}
            disabled={busy}
            className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50"
          >
            {busy ? 'publishing…' : 'publish slate'}
          </button>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {id && (
            <div className="mt-6 flex flex-wrap gap-2">
              <button onClick={() => navigate('share', id)} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">open share</button>
              <button onClick={() => navigator.clipboard.writeText(embed)} className="px-5 py-2.5 rounded-full bg-white/5 text-sm">copy discord link</button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
