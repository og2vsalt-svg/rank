import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';
import { useRouter } from './Router';

const SB_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SB_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type Sheet = {
  id: string;
  title: string | null;
  note: string | null;
  file_name: string | null;
  mime: string | null;
  size: number;
  file_url: string | null;
  share_id: string | null;
  payload: string | null;
  sha256: string | null;
};

function pretty(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

function idOf() {
  return Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 6);
}

async function sha256(file: File) {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function readPayload(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('could not read that file'));
    reader.readAsDataURL(file);
  });
}

export default function VellumPage() {
  const { navigate, shareId } = useRouter();
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState('');
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [loading, setLoading] = useState(Boolean(shareId));

  useEffect(() => {
    if (!shareId) {
      setSheet(null);
      setLoading(false);
      return;
    }
    let live = true;
    setLoading(true);
    fetch(`${SB_URL}/rest/v1/vellum_sheets?id=eq.${encodeURIComponent(shareId)}&select=*&limit=1`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (!live) return;
        setSheet(Array.isArray(data) && data[0] ? data[0] : null);
        if (!Array.isArray(data) || !data[0]) setErr('that sheet is not on the board.');
      })
      .catch(() => {
        if (live) setErr('could not open this sheet.');
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [shareId]);

  const send = async () => {
    if (!file) {
      setErr('pick a local file first.');
      return;
    }
    setErr('');
    setEmbed('');
    setWarn(file.size > 8 * 1024 * 1024 ? 'heavy file. the database copy may feel slow. nothing is refused.' : file.size > 1.4 * 1024 * 1024 ? 'over about 1.4 MB the row keeps the share link, not a second byte copy. still no cap.' : '');
    setBusy('reading');
    try {
      const hash = await sha256(file);
      const keepBytes = file.size <= 1.4 * 1024 * 1024;
      const payload = keepBytes ? await readPayload(file) : null;
      setBusy('sharing');
      const shared = await publishLocalFile(file, { caption: note.trim() || title.trim() || file.name, cardTitle: title.trim() || file.name });
      if (!shared.ok) setWarn(shared.error || warn || 'share copy did not land. the sheet row will still try.');
      const id = idOf();
      const label = (title.trim() || file.name).slice(0, 80);
      setBusy('writing');
      const row = await fetch(`${SB_URL}/rest/v1/vellum_sheets`, {
        method: 'POST',
        headers: {
          apikey: SB_KEY,
          Authorization: `Bearer ${SB_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          id,
          title: label,
          note: note.trim() || null,
          file_name: file.name,
          mime: file.type || 'application/octet-stream',
          size: file.size,
          file_url: shared.url || null,
          share_id: shared.id || null,
          payload,
          sha256: hash,
        }),
      });
      if (!row.ok) {
        const detail = await row.text();
        setErr(detail.slice(0, 180) || 'the sheet did not save');
        return;
      }
      const card = `${location.origin}/vellum/${id}`;
      setEmbed(card);
      try { await navigator.clipboard.writeText(card); } catch { /* clipboard optional */ }
    } catch (e: any) {
      setErr(e?.message || 'vellum stuck');
    } finally {
      setBusy('');
    }
  };

  const downloadHref = sheet?.payload || sheet?.file_url || '';

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          {shareId ? (
            <>
              <p className="text-[#0a84ff] text-sm mb-2">vellum</p>
              <h1 className="text-3xl font-semibold tracking-tight mb-3">{loading ? 'opening…' : sheet?.title || 'missing sheet'}</h1>
              {sheet && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }}>
                  <p className="text-neutral-400 text-sm mb-5">{sheet.note || 'no note on this sheet.'}</p>
                  <div className="rounded-3xl bg-white/[0.03] border border-white/10 p-5">
                    <p className="text-white text-sm break-all">{sheet.file_name || 'file'}</p>
                    <p className="text-xs text-neutral-500 mt-1">{pretty(Number(sheet.size) || 0)} · {sheet.mime || 'file'}</p>
                    <p className="text-[11px] text-neutral-600 mt-2 break-all">{sheet.sha256 ? sheet.sha256.slice(0, 20) + '…' : ''}</p>
                    <p className="text-xs text-neutral-500 mt-3">{sheet.payload ? 'bytes are in the vellum table.' : 'row is in the table. bytes live on the share copy.'}</p>
                    {downloadHref && (
                      <a href={downloadHref} className="inline-flex mt-4 rounded-full bg-white text-black text-xs font-medium px-3 py-1.5 hover:bg-neutral-200 transition" download={sheet.file_name || 'vellum'}>download</a>
                    )}
                  </div>
                </motion.div>
              )}
              {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
              <button type="button" onClick={() => navigate('vellum')} className="mt-6 block text-xs text-[#6eb6ff]">write another</button>
            </>
          ) : (
            <>
              <p className="text-[#0a84ff] text-sm mb-2">vellum</p>
              <h1 className="text-3xl font-semibold tracking-tight mb-3">write a local file into the database.</h1>
              <p className="text-neutral-400 text-sm mb-6">not a drawer. the sheet row lives in Postgres. smaller files also keep a byte copy on that row. a share link sits beside it, and /vellum/id is the Discord card. older desks stay put.</p>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="sheet name" className="w-full mb-3 rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-[#0a84ff]/50 transition" />
              <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="a line for the card" rows={3} className="w-full mb-4 rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-[#0a84ff]/50 resize-none" />
              <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-8 text-center transition duration-200">
                <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                <p className="text-white text-sm font-medium">{file ? file.name : 'choose a local file'}</p>
                <p className="text-xs text-neutral-500 mt-2">{file ? pretty(file.size) : 'no size lock'}</p>
              </label>
              <button type="button" disabled={Boolean(busy)} onClick={send} className="mt-5 rounded-full bg-white text-black text-sm font-medium px-5 py-2.5 hover:bg-neutral-200 active:scale-[0.98] transition disabled:opacity-60">
                {busy ? busy + '…' : 'write and share'}
              </button>
              {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
              {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
              {embed && (
                <div className="mt-6 space-y-2">
                  <p className="text-xs text-neutral-400 break-all">discord card (copied): {embed}</p>
                  <button type="button" onClick={() => navigate('vellumboard')} className="text-xs text-[#6eb6ff]">see the board</button>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
