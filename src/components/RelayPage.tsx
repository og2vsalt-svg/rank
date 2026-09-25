import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { publishShare, fetchShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('read failed'));
    reader.readAsDataURL(file);
  });
}

export default function RelayPage() {
  const { navigate } = useRouter();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [lookup, setLookup] = useState('');

  const send = async (list: FileList | null) => {
    const file = list?.[0];
    if (!file) return;
    setBusy(true);
    setErr('');
    setWarn(file.size > 40 * 1024 * 1024 ? 'huge file. encoding this locally can make the tab crawl. still gonna try.' : '');
    try {
      const id = 'relay-' + uid();
      const dataUrl = await fileToDataUrl(file);
      const res = await publishShare({
        id,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
        author: 'relay',
      });
      if (!res.ok) {
        setErr(res.error || 'could not publish the handoff');
        return;
      }
      if (res.warn) setWarn(res.warn);
      setCode(id);
      setLink(shareUrls(id).embed);
      try {
        await navigator.clipboard.writeText(shareUrls(id).embed);
      } catch {}
    } catch (e: any) {
      setErr(e?.message || 'relay failed');
    } finally {
      setBusy(false);
    }
  };

  const grab = async () => {
    const id = lookup.trim();
    if (!id) return;
    setBusy(true);
    setErr('');
    const meta = await fetchShare(id);
    setBusy(false);
    if (!meta) {
      setErr('no live handoff for that code');
      return;
    }
    navigate('share', meta.id);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">relay</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">hand a file across the room.</h1>
          <p className="text-neutral-400 text-sm mb-6">upload from this machine, get a code plus a discord-ready embed link. the other person types the code and picks it up. no vault required.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/40 p-10 text-center transition">
            <input type="file" className="hidden" onChange={(e) => send(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'sending…' : 'drop one file to start a relay'}</p>
            <p className="text-xs text-neutral-500 mt-2">no hard cap. just a slowness note if it is massive.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {code && (
            <div className="mt-6 rounded-2xl bg-white/[0.04] border border-white/10 p-4">
              <p className="text-[11px] text-neutral-500 mb-1">handoff code</p>
              <p className="text-lg font-medium tracking-tight break-all">{code}</p>
              {link && <p className="text-xs text-neutral-500 mt-3 break-all">discord embed: {link}</p>}
              <button onClick={() => navigate('share', code)} className="mt-4 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">open the drop</button>
            </div>
          )}
          <div className="mt-8 pt-6 border-t border-white/5">
            <p className="text-sm text-neutral-300 mb-3">already have a code?</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                grab();
              }}
              className="flex gap-2"
            >
              <input value={lookup} onChange={(e) => setLookup(e.target.value)} placeholder="relay-…" className="flex-1 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none" />
              <button type="submit" className="px-5 py-2.5 rounded-full bg-white/10 text-sm">pick up</button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
