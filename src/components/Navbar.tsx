import { useState, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useRouter, type Route } from './Router';

type NavItem = { to: Route; label: string };

const primary: NavItem[] = [
  { to: 'softpulse', label: 'softpulse' },
  { to: 'softorbit', label: 'softorbit' },
  { to: 'velvetdusk', label: 'velvetdusk' },
  { to: 'prismglass', label: 'prismglass' },
  { to: 'softwhisp', label: 'softwhisp' },
  { to: 'lumenbreath', label: 'lumenbreath' },
  { to: 'quietmosaic', label: 'quietmosaic' },
  { to: 'lumenweave', label: 'lumenweave' },
  { to: 'glowveil', label: 'glowveil' },
  { to: 'starveil', label: 'starveil' },
  { to: 'lumenribbon', label: 'lumenribbon' },
  { to: 'softmeadow', label: 'softmeadow' },
  { to: 'moonriver', label: 'moonriver' },
  { to: 'riverlight', label: 'riverlight' },
  { to: 'softmist', label: 'softmist' },
  { to: 'petalfield', label: 'petalfield' },
  { to: 'glasscurrent', label: 'glasscurrent' },
  { to: 'silkfield', label: 'silkfield' },
  { to: 'lunarlumen', label: 'lunarlumen' },
  { to: 'quietbloom', label: 'quietbloom' },
  { to: 'lumenhalo', label: 'lumenhalo' },
  { to: 'quietcurrent', label: 'quietcurrent' },
  { to: 'prismdrift', label: 'prismdrift' },
  { to: 'aureolumen', label: 'aureolumen' },
  { to: 'softlumen', label: 'softlumen' },
  { to: 'softripple', label: 'softripple' },
  { to: 'gleamfield', label: 'gleamfield' },
  { to: 'quietorb', label: 'quietorb' },
  { to: 'appleglow', label: 'appleglow' },
  { to: 'springapple', label: 'springapple' },
  { to: 'softaura', label: 'softaura' },
  { to: 'glowdrift', label: 'glowdrift' },
  { to: 'mistveil', label: 'mistveil' },
  { to: 'softtide', label: 'softtide' },
  { to: 'dewfall', label: 'dewfall' },
  { to: 'petaldrift', label: 'petaldrift' },
  { to: 'lumenbloom', label: 'lumenbloom' },
  { to: 'softbloom', label: 'softbloom' },
  { to: 'softprism', label: 'softprism' },
  { to: 'softecho', label: 'softecho' },
  { to: 'lumenspire', label: 'lumenspire' },
  { to: 'lumenmist', label: 'lumenmist' },
  { to: 'lumenwave', label: 'lumenwave' },
  { to: 'lumenarc', label: 'lumenarc' },
  { to: 'velvet', label: 'velvet' },
  { to: 'softcascade', label: 'softcascade' }, { to: 'orbitglow', label: 'orbitglow' }, { to: 'lumenprism', label: 'lumenprism' }, { to: 'softspiral', label: 'softspiral' }, { to: 'lumenline', label: 'lumenline' }, { to: 'lumenveil', label: 'lumenveil' }, { to: 'softveil', label: 'softveil' }, { to: 'driftline', label: 'driftline' }, { to: 'whisper', label: 'whisper' }, { to: 'softglow', label: 'softglow' }, { to: 'softfold', label: 'softfold' }, { to: 'moonveil', label: 'moonveil' }, { to: 'lullaby', label: 'lullaby' }, { to: 'kindle', label: 'kindle' }, { to: 'haven', label: 'haven' }, { to: 'spectrum', label: 'spectrum' }, { to: 'aurora', label: 'aurora' }, { to: 'stillpoint', label: 'stillpoint' }, { to: 'lumenfield', label: 'lumenfield' }, { to: 'quietledger', label: 'quietledger' }, { to: 'silkveil', label: 'silkveil' }, { to: 'quietude', label: 'quietude' }, { to: 'lull', label: 'lull' }, { to: 'iridescence', label: 'iridescence' }, { to: 'mist', label: 'mist' }, { to: 'nacre', label: 'nacre' }, { to: 'luster', label: 'luster' }, { to: 'gleam', label: 'gleam' }, { to: 'mirage', label: 'mirage' }, { to: 'zenith', label: 'zenith' }, { to: 'celestial', label: 'celestial' }, { to: 'tidepool', label: 'tidepool' }, { to: 'solarium', label: 'solarium' }, { to: 'capsule', label: 'capsule' }, { to: 'prismwell', label: 'prismwell' }, { to: 'echochamber', label: 'echo' }, { to: 'gossamer', label: 'gossamer' }, { to: 'velum', label: 'velum' }, { to: 'crescent', label: 'crescent' }, { to: 'nightfall', label: 'nightfall' }, { to: 'vesper', label: 'vesper' }, { to: 'zephyr', label: 'zephyr' }, { to: 'serenity', label: 'serenity' }, { to: 'murmur', label: 'murmur' }, { to: 'drift', label: 'drift' }, { to: 'stillwater', label: 'stillwater' }, { to: 'tapestry', label: 'tapestry' }, { to: 'observatory', label: 'observatory' }, { to: 'constellation', label: 'constellation' }, { to: 'solaris', label: 'solaris' }, { to: 'helios', label: 'helios' }, { to: 'nebula', label: 'nebula' }, { to: 'solstice', label: 'solstice' }, { to: 'lumen', label: 'lumen' }, { to: 'meridian', label: 'meridian' }, { to: 'cascade', label: 'cascade' }, { to: 'vaultlight', label: 'light' }, { to: 'dock', label: 'dock' }, { to: 'horizon', label: 'horizon' }, { to: 'drop', label: 'drop' }, { to: 'nexus', label: 'nexus' }, { to: 'studiodrop', label: 'studio' }, { to: 'quill', label: 'quill' }, { to: 'halo', label: 'halo' }, { to: 'ripple', label: 'ripple' }, { to: 'grokdrop', label: 'grok' }, { to: 'pulse', label: 'pulse' }, { to: 'gallery', label: 'gallery' }, { to: 'vault', label: 'vault' }, { to: 'sharehub', label: 'shares' }, { to: 'apex', label: 'apex' }, { to: 'candela', label: 'candela' }, { to: 'scroll', label: 'scroll' },
];

const groups: { title: string; items: NavItem[] }[] = [
  { title: 'new', items: [{ to: 'softpulse', label: 'softpulse' }, { to: 'softorbit', label: 'softorbit' }, { to: 'velvetdusk', label: 'velvetdusk' }, { to: 'prismglass', label: 'prismglass' }, { to: 'softwhisp', label: 'softwhisp' }, { to: 'lumenbreath', label: 'lumenbreath' }, { to: 'quietmosaic', label: 'quietmosaic' }, { to: 'lumenweave', label: 'lumenweave' }, { to: 'glowveil', label: 'glowveil' }, { to: 'starveil', label: 'starveil' }, { to: 'lumenribbon', label: 'lumenribbon' }, { to: 'softmeadow', label: 'softmeadow' }, { to: 'moonriver', label: 'moonriver' }, { to: 'riverlight', label: 'riverlight' }, { to: 'softmist', label: 'softmist' }, { to: 'petalfield', label: 'petalfield' }, { to: 'glasscurrent', label: 'glasscurrent' }, { to: 'silkfield', label: 'silkfield' }, { to: 'lunarlumen', label: 'lunarlumen' }, { to: 'quietbloom', label: 'quietbloom' }, { to: 'lumenhalo', label: 'lumenhalo' }, { to: 'quietcurrent', label: 'quietcurrent' }, { to: 'prismdrift', label: 'prismdrift' }, { to: 'aureolumen', label: 'aureolumen' }, { to: 'softlumen', label: 'softlumen' }, { to: 'softripple', label: 'softripple' }, { to: 'gleamfield', label: 'gleamfield' }, { to: 'quietorb', label: 'quietorb' }, { to: 'appleglow', label: 'appleglow' }, { to: 'springapple', label: 'springapple' }, { to: 'softaura', label: 'softaura' }, { to: 'glowdrift', label: 'glowdrift' }, { to: 'mistveil', label: 'mistveil' }, { to: 'softtide', label: 'softtide' }, { to: 'dewfall', label: 'dewfall' }, { to: 'petaldrift', label: 'petaldrift' }, { to: 'lumenbloom', label: 'lumenbloom' }, { to: 'softbloom', label: 'softbloom' }, { to: 'softprism', label: 'softprism' }, { to: 'softecho', label: 'softecho' }, { to: 'lumenspire', label: 'lumenspire' }, { to: 'lumenmist', label: 'lumenmist' }, { to: 'lumenwave', label: 'lumenwave' }, { to: 'lumenarc', label: 'lumenarc' }, { to: 'velvet', label: 'velvet' }, { to: 'softcascade', label: 'softcascade' }, { to: 'orbitglow', label: 'orbitglow' }, { to: 'lumenprism', label: 'lumenprism' }, { to: 'softspiral', label: 'softspiral' }, { to: 'lumenline', label: 'lumenline' }, { to: 'lumenveil', label: 'lumenveil' }, { to: 'softveil', label: 'softveil' }, { to: 'driftline', label: 'driftline' }, { to: 'whisper', label: 'whisper' }, { to: 'softglow', label: 'softglow' }, { to: 'softfold', label: 'softfold' }, { to: 'moonveil', label: 'moonveil' }, { to: 'lullaby', label: 'lullaby' }, { to: 'kindle', label: 'kindle' }, { to: 'haven', label: 'haven' }, { to: 'spectrum', label: 'spectrum' }, { to: 'aurora', label: 'aurora' }, { to: 'stillpoint', label: 'stillpoint' }, { to: 'lumenfield', label: 'lumenfield' }, { to: 'quietledger', label: 'quietledger' }, { to: 'silkveil', label: 'silkveil' }, { to: 'quietude', label: 'quietude' }, { to: 'lull', label: 'lull' }, { to: 'iridescence', label: 'iridescence' }, { to: 'mist', label: 'mist' }, { to: 'nacre', label: 'nacre' }, { to: 'luster', label: 'luster' }, { to: 'gleam', label: 'gleam' }, { to: 'mirage', label: 'mirage' }, { to: 'zenith', label: 'zenith' }, { to: 'celestial', label: 'celestial' }, { to: 'tidepool', label: 'tidepool' }, { to: 'solarium', label: 'solarium' }, { to: 'capsule', label: 'capsule' }, { to: 'prismwell', label: 'prismwell' }, { to: 'echochamber', label: 'echochamber' }, { to: 'gossamer', label: 'gossamer' }, { to: 'velum', label: 'velum' }, { to: 'crescent', label: 'crescent' }, { to: 'nightfall', label: 'nightfall' }, { to: 'vesper', label: 'vesper' }, { to: 'zephyr', label: 'zephyr' }, { to: 'serenity', label: 'serenity' }, { to: 'murmur', label: 'murmur' }, { to: 'drift', label: 'drift' }, { to: 'stillwater', label: 'stillwater' }, { to: 'tapestry', label: 'tapestry' }, { to: 'observatory', label: 'observatory' }, { to: 'constellation', label: 'constellation' }, { to: 'solaris', label: 'solaris' }, { to: 'helios', label: 'helios' }, { to: 'nebula', label: 'nebula' }, { to: 'solstice', label: 'solstice' }, { to: 'eclipse', label: 'eclipse' }, { to: 'scroll', label: 'scroll' }, { to: 'candela', label: 'candela' }, { to: 'lumen', label: 'lumen' }, { to: 'meridian', label: 'meridian' }, { to: 'cascade', label: 'cascade' }, { to: 'vaultlight', label: 'vaultlight' }, { to: 'twilight', label: 'twilight' }, { to: 'dock', label: 'dock' }, { to: 'horizon', label: 'horizon' }, { to: 'nexus', label: 'nexus' }, { to: 'apex', label: 'apex' }, { to: 'studiodrop', label: 'studiodrop' }, { to: 'quill', label: 'quill' }, { to: 'halo', label: 'halo' }, { to: 'ripple', label: 'ripple' }, { to: 'grokdrop', label: 'grokdrop' }, { to: 'pulse', label: 'pulse' }, { to: 'glimmer', label: 'glimmer' }, { to: 'harbor', label: 'harbor' }, { to: 'echo', label: 'echo' }, { to: 'prism', label: 'prism' }, { to: 'stream', label: 'stream' }, { to: 'nimbus', label: 'nimbus' }, { to: 'aether', label: 'aether' }, { to: 'dresser', label: 'dresser' }, { to: 'conduit', label: 'conduit' }, { to: 'atelier', label: 'atelier' }, { to: 'scriptorium', label: 'scriptorium' }, { to: 'vignette', label: 'vignette' }, { to: 'studio', label: 'studio' }, { to: 'oratory', label: 'oratory' }, { to: 'gallery', label: 'gallery' }, { to: 'quay', label: 'quay' }, { to: 'sharehub', label: 'sharehub' }, { to: 'mosaic', label: 'mosaic' }, { to: 'canvas', label: 'canvas' }, { to: 'reliquary', label: 'reliquary' }, { to: 'cartouche', label: 'cartouche' }, { to: 'fillet', label: 'fillet' }, { to: 'impost', label: 'impost' }, { to: 'reading', label: 'reading' }, { to: 'abacus', label: 'abacus' }, { to: 'campanile', label: 'campanile' }, { to: 'ogee', label: 'ogee' }, { to: 'socle', label: 'socle' }, { to: 'fluting', label: 'fluting' }, { to: 'stylobate', label: 'stylobate' }, { to: 'coffer', label: 'coffer' }, { to: 'corbel', label: 'corbel' }, { to: 'metope', label: 'metope' }, { to: 'triglyph', label: 'triglyph' }, { to: 'modillion', label: 'modillion' }, { to: 'dentil', label: 'dentil' }, { to: 'chevron', label: 'chevron' }, { to: 'patera', label: 'patera' }, { to: 'labelstop', label: 'labelstop' }, { to: 'lunette', label: 'lunette' }, { to: 'astragal', label: 'astragal' }, { to: 'crossette', label: 'crossette' }, { to: 'tympanum', label: 'tympanum' }, { to: 'voussoir', label: 'voussoir' }, { to: 'lorgnette', label: 'lorgnette' }, { to: 'monocle', label: 'monocle' }, { to: 'reticule', label: 'reticule' }, { to: 'drawstring', label: 'drawstring' }, { to: 'oriel', label: 'oriel' }, { to: 'quillon', label: 'quillon' }, { to: 'scantling', label: 'scantling' }, { to: 'margent', label: 'margent' }, { to: 'ovolo', label: 'ovolo' }, { to: 'mutule', label: 'mutule' }, { to: 'plinth', label: 'plinth' }, { to: 'inlet', label: 'inlet' }, { to: 'cyma', label: 'cyma' }, { to: 'taenia', label: 'taenia' }, { to: 'spandrel', label: 'spandrel' }, { to: 'stringcourse', label: 'stringcourse' }, { to: 'beltcourse', label: 'beltcourse' }, { to: 'hoodmold', label: 'hoodmold' }, { to: 'gutta', label: 'gutta' }, { to: 'echinus', label: 'echinus' }, { to: 'cavetto', label: 'cavetto' }, { to: 'lintel', label: 'lintel' }, { to: 'sill', label: 'sill' }, { to: 'scotia', label: 'scotia' }] },
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
          <div className="hidden md:flex items-center gap-1 text-sm">
            {primary.map((item) => (
              <button key={item.to} onClick={() => go(item.to)} className={`px-3 py-1.5 rounded-full transition ${route === item.to ? 'bg-white text-black' : 'text-neutral-300 hover:text-white hover:bg-white/10'}`}>
                {item.label}
              </button>
            ))}
            <div className="relative" ref={ref}>
              <button onClick={() => setOpen((v) => !v)} className="px-3 py-1.5 rounded-full text-neutral-300 hover:text-white hover:bg-white/10 transition">more</button>
              {open && (
                <div className="absolute right-0 mt-2 w-[520px] max-h-[70vh] overflow-auto rounded-2xl glass p-2 shadow-2xl">
                  {groups.map((g) => (
                    <div key={g.title} className="mb-2">
                      <p className="px-2 py-1 text-[10px] uppercase tracking-wider text-neutral-500">{g.title}</p>
                      <div className="grid grid-cols-3 gap-1">
                        {g.items.map((item) => (
                          <button key={item.to} onClick={() => go(item.to)} className={`text-left px-2 py-1.5 rounded-xl text-xs ${route === item.to ? 'bg-white text-black' : 'text-neutral-300 hover:bg-white/10'}`}>
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <button onClick={signOut} className="text-xs text-neutral-400 hover:text-white px-2">out</button>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
}
