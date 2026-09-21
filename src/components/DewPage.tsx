import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

export default function DewPage() {
  const { navigate } = useRouter();
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [msg, setMsg] = useState('');
  const [link, setLink] = useState('');
  const [embed, setEmbed] = useState('');

  const drop = async (file: File) => {
    setBusy(true);
    setMsg('');
    setWarn(file.size > 8 * 1024 * 1024 ? 'big file. upload can feel slow. no hard cap.' : '');
    try {
      const dataUrl = await readFile(file);
      const id = uid();
      const res = await publishShare({
        id,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
      });
      if (!res.ok) {
        setMsg(res.error || 'cloud said no');
        return;
      }
      const urls = shareUrls(res.id || id);
      setLink(urls.app);
      setEmbed(urls.embed);
      setMsg(res.warn || 'live on the share table');
    } catch (e: any) {
      setMsg(e?.message || 'could not read file');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">dew</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">one file, live share, discord-ready.</h1>
          <p className="text-neutral-400 text-sm mb-6">uploads into the public_shares table. vault stays private. paste the /s/ link in discord for a clean embed.</p>
          <label className="block rounded-2xl border border-dashed border-white/15 px-5 py-12 text-center text-sm text-neutral-400 cursor-pointer hover:border-white/30 transition-colors mb-5">
            {busy ? 'sending…' : 'drop any file here. huge ones just warn about slowness.'}
            <input type="file" className="hidden" disabled={busy} onChange={(e) => { const f = e.target.files?.[0]; if (f) drop(f); }} />
          </label>
          {warn && <p className="text-xs text-amber-400/80 mb-3">{warn}</p>}
          {msg && <p className="text-sm text-neutral-300 mb-4">{msg}</p>}
          {embed && (
            <div className="space-y-2">
              <p className="text-xs text-neutral-500 break-all">embed {embed}</p>
              <p className="text-xs text-neutral-500 break-all">app {link}</p>
              <div className="flex gap-2">
                <button onClick={() => navigator.clipboard.writeText(embed)} className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium">copy discord link</button>
                <button onClick={() => navigate('share', embed.split('/').pop())} className="px-4 py-2 rounded-full bg-white/5 text-sm">open share</button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
