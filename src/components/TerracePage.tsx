import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';

function toDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function TerracePage() {
  const { navigate } = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');

  const upload = async (file: File) => {
    setBusy(true);
    setErr('');
    setWarn(file.size > 40 * 1024 * 1024 ? 'large file. clients may feel slow. no hard cap.' : '');
    try {
      const dataUrl = await toDataUrl(file);
      const r = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl,
          author: 'terrace',
        }),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error || 'upload failed');
      const embed = `${window.location.origin}/s/${json.id}`;
      setLink(embed);
      if (json.warn) setWarn(json.warn);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'upload failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-3xl p-8">
          <p className="text-[#0a84ff] text-sm mb-2">terrace</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">put a local file on the public table.</h1>
          <p className="text-neutral-400 text-sm mb-6">uploads through /api/share into the supabase row. discord gets a /s embed that looks finished.</p>
          <label className="block rounded-3xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-10 text-center cursor-pointer hover:bg-white/[0.05] transition-colors">
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) upload(f);
              }}
            />
            <span className="text-sm text-neutral-300">{busy ? 'sending…' : 'choose a file'}</span>
          </label>
          {warn && <p className="text-amber-300/80 text-xs mt-4">{warn}</p>}
          {err && <p className="text-red-400 text-xs mt-4">{err}</p>}
          {link && (
            <div className="mt-6 space-y-3">
              <p className="text-xs text-neutral-500 break-all">{link}</p>
              <div className="flex gap-2">
                <button onClick={() => navigator.clipboard.writeText(link)} className="px-4 py-2 rounded-full bg-white text-black text-xs font-medium">copy discord link</button>
                <button onClick={() => navigate('foyer')} className="px-4 py-2 rounded-full bg-white/5 text-xs">open foyer</button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
