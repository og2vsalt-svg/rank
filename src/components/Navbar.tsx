import { useState, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useRouter, type Route } from './Router';

type NavItem = { to: Route; label: string };

const primary: NavItem[] = [
  { to: 'softlumenbay', label: 'softlumenbay' },
  { to: 'softhorizon', label: 'softhorizon' },
  { to: 'softaether', label: 'softaether' },
  { to: 'softjournal', label: 'softjournal' },
  { to: 'softpulse', label: 'softpulse' },
  { to: 'softorbit', label: 'softorbit' },
  { to: 'softconstellation', label: 'softconstellation' },
  { to: 'softgrove', label: 'softgrove' },
  { to: 'softlumendusk', label: 'softlumendusk' },
  { to: 'softlumen', label: 'softlumen' },
  { to: 'softmeadow', label: 'softmeadow' },
  { to: 'softquietharbor', label: 'softquietharbor' },
  { to: 'softprism', label: 'softprism' },
  { to: 'softwhisper', label: 'softwhisper' },
  { to: 'softvelvet', label: 'softvelvet' },
  { to: 'softaurora', label: 'softaurora' },
  { to: 'softnimbus', label: 'softnimbus' },
  { to: 'softrefract', label: 'softrefract' },
  { to: 'softquay', label: 'softquay' },
  { to: 'softmeridian', label: 'softmeridian' },
  { to: 'softlinen', label: 'softlinen' },
  { to: 'softquire', label: 'softquire' },
  { to: 'softgossamer', label: 'softgossamer' },
  { to: 'softdrift', label: 'softdrift' },
  { to: 'flowshare', label: 'flowshare' },
  { to: 'quietlumenflow', label: 'quietlumenflow' },
  { to: 'quietcascade', label: 'quietcascade' },
  { to: 'quietmirror', label: 'quietmirror' },
  { to: 'softlumenvista', label: 'softlumenvista' },
  { to: 'quietink', label: 'quietink' },
  { to: 'softmosaic', label: 'softmosaic' },
  { to: 'lumenledger', label: 'lumenledger' },
  { to: 'softlumenscroll', label: 'softlumenscroll' },
  { to: 'softlumengalaxy', label: 'softlumengalaxy' },
  { to: 'lumennexus', label: 'lumennexus' },
  { to: 'lumencascade', label: 'lumencascade' },
  { to: 'softlumenboard', label: 'softlumenboard' },
  { to: 'ember', label: 'ember' },
  { to: 'equinox', label: 'equinox' },
  { to: 'softlumenportico', label: 'softlumenportico' },
  { to: 'softlumenpavilion', label: 'softlumenpavilion' },
  { to: 'softlumenquay', label: 'softlumenquay' },
  { to: 'softlumenharbor', label: 'softlumenharbor' },
  { to: 'softlumenkeepsake', label: 'softlumenkeepsake' },
  { to: 'quietlumenbloom', label: 'quietlumenbloom' },
  { to: 'softlumenweave', label: 'softlumenweave' },
  { to: 'softlumenwell', label: 'softlumenwell' },
  { to: 'softlumenhelix', label: 'softlumenhelix' },
  { to: 'softlumenlattice', label: 'softlumenlattice' },
  { to: 'quietlumensphere', label: 'quietlumensphere' },
  { to: 'softlumenatelier', label: 'softlumenatelier' },
  { to: 'softlumenripple', label: 'softlumenripple' },
  { to: 'softnotegarden', label: 'softnotegarden' },
  { to: 'softlumendrift', label: 'softlumendrift' },
  { to: 'softsecurevault', label: 'softsecurevault' },
  { to: 'softlumencollage', label: 'softlumencollage' },
  { to: 'softquietgallery', label: 'softquietgallery' },
  { to: 'softmotes', label: 'softmotes' },
  { to: 'softlumenfield', label: 'softlumenfield' },
  { to: 'quietlumennest', label: 'quietlumennest' },
  { to: 'softauroraveil', label: 'softauroraveil' },
  { to: 'softlumenecho', label: 'softlumenecho' },
  { to: 'softlumenfalls', label: 'softlumenfalls' },
  { to: 'softmoonwell', label: 'softmoonwell' },
  { to: 'softstillwater', label: 'softstillwater' },
  { to: 'softlumenframes', label: 'softlumenframes' },
  { to: 'softlumenjournal', label: 'softlumenjournal' },
  { to: 'softlumenprism', label: 'softlumenprism' },
  { to: 'softlumenhorizon', label: 'softlumenhorizon' },
  { to: 'softlumenmosaic', label: 'softlumenmosaic' },
  { to: 'quietworkshop', label: 'quietworkshop' },
  { to: 'softlumenaether', label: 'softlumenaether' },
  { to: 'softlumenvault', label: 'softlumenvault' },
  { to: 'softfilegrove', label: 'softfilegrove' },
  { to: 'softlumenorchard', label: 'softlumenorchard' },
  { to: 'softlumenlanterns', label: 'softlumenlanterns' },
  { to: 'softlumenribbon', label: 'softlumenribbon' },
  { to: 'quietprismfield', label: 'quietprismfield' },
  { to: 'softlumenindex', label: 'softlumenindex' },
  { to: 'softlumenarchive', label: 'softlumenarchive' },
  { to: 'softlumenchamber', label: 'softlumenchamber' },
  { to: 'softlumenorbit', label: 'softlumenorbit' },
  { to: 'softlumenstudio', label: 'softlumenstudio' },
  { to: 'softtidepool', label: 'softtidepool' },
  { to: 'lumenforge', label: 'lumenforge' },
  { to: 'softstillfield', label: 'softstillfield' },
  { to: 'softlumenhaven', label: 'softlumenhaven' },
  { to: 'lumenquay', label: 'lumenquay' },
  { to: 'lumenmeridian', label: 'lumenmeridian' },
  { to: 'softlumennest', label: 'softlumennest' },
  { to: 'quietlumenboard', label: 'quietlumenboard' },
  { to: 'softlumencascade', label: 'softlumencascade' },
  { to: 'quietatlas', label: 'quietatlas' },
  { to: 'quietsanctuary', label: 'quietsanctuary' },
  { to: 'softcanvas', label: 'softcanvas' },
  { to: 'softatelier', label: 'softatelier' },
  { to: 'softledger', label: 'softledger' },
  { to: 'appledesk', label: 'appledesk' },
  { to: 'softlumengrove', label: 'softlumengrove' },
  { to: 'softlumenpath', label: 'softlumenpath' },
  { to: 'softauroracanvas', label: 'softauroracanvas' },
  { to: 'quiettimeline', label: 'quiettimeline' },
  { to: 'whisperwall', label: 'whisperwall' },
  { to: 'softlumenmist', label: 'softlumenmist' },
  { to: 'softglimmer', label: 'softglimmer' },
  { to: 'quiethearth', label: 'quiethearth' },
  { to: 'quietfog', label: 'quietfog' },
  { to: 'softbloom', label: 'softbloom' },
  { to: 'softlumenpool', label: 'softlumenpool' },
  { to: 'softstillroom', label: 'softstillroom' },
  { to: 'softhelix', label: 'softhelix' },
  { to: 'quietprism', label: 'quietprism' },
  { to: 'lumenring', label: 'lumenring' },
  { to: 'softbasin', label: 'softbasin' },
  { to: 'softcove', label: 'softcove' },
  { to: 'softstream', label: 'softstream' },
  { to: 'softlumenflow', label: 'softlumenflow' },
  { to: 'softharbor', label: 'softharbor' },
  { to: 'softfalls', label: 'softfalls' },
  { to: 'softarchive', label: 'softarchive' },
  { to: 'softcandle', label: 'softcandle' },
  { to: 'quietmosaic', label: 'quietmosaic' },
  { to: 'softlumenveil', label: 'softlumenveil' },
  { to: 'softember', label: 'softember' },
  { to: 'quietglow', label: 'quietglow' },
  { to: 'quietnebula', label: 'quietnebula' },
  { to: 'softlantern', label: 'softlantern' },
  { to: 'chronicle', label: 'chronicle' },
  { to: 'softhalo', label: 'softhalo' },
  { to: 'softlumenhearth', label: 'softlumenhearth' },
  { to: 'softripple', label: 'softripple' },
  { to: 'softecho', label: 'softecho' },
  { to: 'softlumenorb', label: 'softlumenorb' },
  { to: 'softcascade', label: 'softcascade' },
  { to: 'auroraweave', label: 'auroraweave' },
  { to: 'softpetal', label: 'softpetal' },
  { to: 'lumenrain', label: 'lumenrain' },
  { to: 'softlumenfall', label: 'softlumenfall' },
  { to: 'prismvault', label: 'prismvault' },
  { to: 'quietfolio', label: 'quietfolio' },
];

export default function Navbar() {
  const { route, navigate } = useRouter();
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const go = (to: Route) => {
    navigate(to);
    setOpen(false);
  };

  return (
    <nav className="fixed top-0 inset-x-0 z-50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mt-3 flex items-center justify-between rounded-2xl glass px-3 py-2 sm:px-4">
          <button onClick={() => go('home')} className="text-sm font-semibold tracking-tight">rankvault</button>
          <div className="hidden md:flex items-center gap-1 text-sm overflow-x-auto">
            {primary.map((item) => (
              <button key={item.to} onClick={() => go(item.to)} className={`px-3 py-1.5 rounded-full transition whitespace-nowrap ${route === item.to ? 'bg-white text-black' : 'text-neutral-300 hover:text-white hover:bg-white/10'}`}>
                {item.label}
              </button>
            ))}
          </div>
          <div className="md:hidden" ref={ref}>
            <button onClick={() => setOpen((o) => !o)} className="px-3 py-1.5 text-sm rounded-full hover:bg-white/10">menu</button>
            {open && (
              <div className="absolute right-4 top-16 glass rounded-2xl p-2 max-h-[70vh] overflow-y-auto w-48">
                {primary.map((item) => (
                  <button key={item.to} onClick={() => go(item.to)} className={`block w-full text-left px-3 py-2 text-sm rounded-xl ${route === item.to ? 'bg-white text-black' : 'hover:bg-white/10'}`}>
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
