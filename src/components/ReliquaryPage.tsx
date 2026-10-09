import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

const SB_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

async function fingerprint(file: File) {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function ReliquaryPage() {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [author, setAuthor] = useState('');
  const [recipient, setRecipient] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState<string | null>(null);
  const [id, setId] = useState('');
  const [copied, setCopied] = useState('');

  const send = async () => {
    if (!file) return;
    setBusy(true);
    setErr('');
    setWarn(file.size > 12 * 1024 * 1024 ? 'large drop. this can feel slow. nothing is refused.' : null);
    try {
      const sha = await fingerprint(file);
      const res = await publishLocalFile(file, {
        caption,
        author,
        cardTitle: recipient || file.name,
        color: '#0A84FF',
        meta: { desk: 'reliquary', sha256: sha },
      });
      if (!res.ok || !res.id) {
        setErr(res.error || 'could not write the share');
        return;
      }
      const slipId = res.id.slice(0, 12);
      await fetch(`${SB_URL}/rest/v1/reliquary_slips`, {
        method: 'POST',
        headers: {
          apikey: SB_KEY,
          Authorization: `Bearer ${SB_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          id: slipId,
          recipient: recipient || 'unnamed',
          condition: caption || 'filed as found',
          share_id: res.id,
          file_name: file.name,
          file_url: res.url || null,
          mime: file.type || 'application/octet-stream',
          size: file.size,
          sha256: sha,
          author: author || null,
        }),
      });
      setId(res.id);
      setWarn(res.warn || (file.size > 12 * 1024 * 1024 ? 'large drop. this can feel slow. nothing is refused.' : null));
      history.pushState({}, '', `/reliquary/${slipId}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'could not write the share');
    } finally {
      setBusy(false);
    }
  };

  const urls = id ? shareUrls(id) : null;
  const copy = async (label: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(''), 1200);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] uppercase tracking-[0.16em] text-white/45">reliquary</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">put a local file in the share table</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">The bytes go into the shares bucket. A receipt row keeps the condition and the hash. Paste the link in Discord for a card. Large drops are warned, never refused. Older desks stay.</p>
        </motion.div>
        <label className="glass mt-8 block cursor-pointer rounded-3xl p-8 text-center transition active:scale-[0.99]">
          <input className="hidden" type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <div className="text-[15px] text-white/80">{file ? file.name : 'choose a file from this machine'}</div>
          <div className="mt-1 text-[12px] text-white/40">{file ? 'no cap, just a warning if it is heavy' : 'any type'}</div>
        </label>
        <div className="mt-4 grid gap-3">
          <input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="who this is for" className="glass rounded-2xl px-4 py-3 text-[14px] outline-none" />
          <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="condition, for the discord card" className="glass rounded-2xl px-4 py-3 text-[14px] outline-none" />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="name on the card, optional" className="glass rounded-2xl px-4 py-3 text-[14px] outline-none" />
        </div>
        <button onClick={send} disabled={!file || busy} className="mt-4 w-full rounded-full bg-[#0A84FF] px-4 py-3 text-[15px] font-medium text-white transition active:scale-[0.98] disabled:opacity-40">{busy ? 'sending…' : 'upload to the database'}</button>
        {warn && <p className="mt-3 text-[13px] text-amber-200/80">{warn}</p>}
        {err && <p className="mt-3 text-[13px] text-red-300">{err}</p>}
        {urls && (
          <div className="glass mt-6 rounded-3xl p-5">
            <p className="text-[13px] text-white/50">discord card</p>
            <p className="mt-1 break-all text-[15px]">{urls.embed}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => copy('card', urls.embed)} className="rounded-full bg-white/10 px-3 py-1.5 text-[13px]">{copied === 'card' ? 'copied' : 'copy /s link'}</button>
              <button onClick={() => copy('app', `${window.location.origin}/reliquary/${id.slice(0, 12)}`)} className="rounded-full bg-white/10 px-3 py-1.5 text-[13px]">{copied === 'app' ? 'copied' : 'copy receipt link'}</button>
              <a href="/sacristy" className="rounded-full bg-white/10 px-3 py-1.5 text-[13px]">all receipts</a>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
