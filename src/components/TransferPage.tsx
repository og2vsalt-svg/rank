import { useState } from 'react';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

export default function TransferPage() {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [warn, setWarn] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const { navigate } = useRouter();

  const onPick = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setErr(null);
    setWarn(file.size > 40 * 1024 * 1024 ? 'big file. clients may crawl while it lands.' : null);
    try {
      const dataUrl = await readAsDataUrl(file);
      const id = uid();
      const res = await publishShare({
        id,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
      });
      if (!res.ok) {
        setErr(res.error || 'could not land the file');
        return;
      }
      const urls = shareUrls(res.id || id);
      setLink(urls.embed);
    } catch (e: any) {
      setErr(e?.message || 'read failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-16 px-5 max-w-xl mx-auto">
        <p className="text-[#0a84ff] text-sm mb-2">transfer</p>
        <h1 className="text-3xl font-semibold tracking-tight mb-3">hand a file to the cloud.</h1>
        <p className="text-neutral-400 text-sm mb-6">uploads into the public shares table. discord unfurls the /s/ link.</p>
        <label className="block glass rounded-3xl p-10 text-center cursor-pointer hover:bg-white/[0.04] transition-colors">
          <input type="file" className="hidden" onChange={(e) => onPick(e.target.files?.[0])} />
          <p className="text-white font-medium">{busy ? 'landing…' : 'drop or pick a file'}</p>
          <p className="text-xs text-neutral-500 mt-2">no hard cap. just a slowness note if it is huge.</p>
        </label>
        {warn && <p className="text-amber-400 text-xs mt-4">{warn}</p>}
        {err && <p className="text-red-400 text-xs mt-4">{err}</p>}
        {link && (
          <div className="mt-6 glass rounded-3xl p-5">
            <p className="text-xs text-neutral-500 mb-2">share this</p>
            <p className="text-sm break-all text-white">{link}</p>
            <button onClick={() => navigate('share', link.split('/').pop())} className="mt-4 text-sm text-[#0a84ff]">
              open preview
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
