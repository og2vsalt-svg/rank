import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('could not read file'));
    r.readAsDataURL(file);
  });
}

export default function ScripPage() {
  const [owed, setOwed] = useState('');
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');

  const issue = async () => {
    setErr('');
    setBusy(true);
    try {
      let dataUrl = '';
      let name = 'scrip.txt';
      let type = 'text/plain';
      let size = 0;
      if (file) {
        setWarn(file.size > 20 * 1024 * 1024 ? 'large attachment. encoding may feel sleepy. no hard cap.' : '');
        dataUrl = await readAsDataUrl(file);
        name = file.name;
        type = file.type || 'application/octet-stream';
        size = file.size;
      } else {
        const body = [
          'rankvault scrip',
          `owed: ${owed.trim() || 'unspecified'}`,
          `note: ${note.trim() || '—'}`,
          `issued: ${new Date().toISOString()}`,
        ].join('\n');
        dataUrl = 'data:text/plain;charset=utf-8,' + encodeURIComponent(body);
        size = body.length;
      }
      const id = `scrip-${Date.now().toString(36)}`;
      const title = owed.trim() ? `scrip · ${owed.trim().slice(0, 48)}` : name;
      const res = await publishShare({
        id,
        name: title,
        type,
        size,
        dataUrl,
        author: 'scrip',
      });
      if (!res.ok) throw new Error(res.error || 'could not issue');
      if (res.warn) setWarn(res.warn);
      const urls = shareUrls(id);
      setLink(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20 px-5">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="max-w-xl mx-auto">
          <p className="text-[#0a84ff] text-sm mb-2">scrip</p>
          <h1 className="text-4xl font-semibold tracking-tight text-white mb-3">issue a quiet iou from this tab.</h1>
          <p className="text-neutral-400 text-sm mb-8">not a vault grid. write what is owed, optionally attach a local file, mint a public drop. discord unfurls /s.</p>
          <input value={owed} onChange={(e) => setOwed(e.target.value)} placeholder="what is owed" className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none mb-3" />
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="terms, if any" rows={4} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none mb-4 resize-none" />
          <label className="block glass rounded-3xl p-6 text-center cursor-pointer mb-5 hover:bg-white/[0.04] transition-colors">
            <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <p className="text-white text-sm">{file ? file.name : 'optional attachment'}</p>
          </label>
          <button onClick={issue} disabled={busy || (!owed.trim() && !note.trim() && !file)} className="w-full rounded-full bg-white text-black py-3 text-sm font-medium disabled:opacity-40 hover:bg-neutral-200 transition-colors">
            {busy ? 'issuing…' : 'issue and copy embed'}
          </button>
          {warn && <p className="text-amber-300/80 text-xs mt-4">{warn}</p>}
          {err && <p className="text-red-400 text-xs mt-4">{err}</p>}
          {link && <p className="text-[#0a84ff] text-xs mt-4 break-all">{link}</p>}
        </motion.div>
      </main>
    </div>
  );
}
