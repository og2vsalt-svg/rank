import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from './Router';
import { useAuth } from './AuthContext';

export default function Navbar() {
  const { navigate, route } = useRouter();
  const { user, logout, isLoggedIn } = useAuth();
  const [open, setOpen] = useState(false);

  const links = [
    { to: 'prismpulse', label: 'prism pulse' },
    { to: 'aethercapsule', label: 'aether capsule' },
    { to: 'quietmosaic', label: 'quiet mosaic' },
    { to: 'echoprism', label: 'echo prism' },
    { to: 'silkboard', label: 'silk board' },
    { to: 'velvetledger', label: 'velvet ledger' },
    { to: 'orbitbundle', label: 'orbit bundle' },
    { to: 'whispercapsule', label: 'whisper capsule' },
    { to: 'glassreceipt', label: 'glass receipt' },
    { to: 'prismsketch', label: 'prism sketch' },
    { to: 'quietharbor', label: 'quiet harbor' },
    { to: 'silkmosaic', label: 'silk mosaic' },
    { to: 'aethertimeline', label: 'aether timeline' },
    { to: 'prismcode', label: 'prism code' },
    { to: 'aetherecho', label: 'aether echo' },
    { to: 'prismjournal', label: 'prism journal' },
    { to: 'moodatlas', label: 'mood atlas' },
    { to: 'echonote', label: 'echo note' },
    { to: 'horizonforge', label: 'horizon forge' },
    { to: 'prismvault', label: 'prism vault' },
    { to: 'silkweave', label: 'silk weave' },
    { to: 'quietdrift', label: 'quiet drift' },
    { to: 'quietcascade', label: 'quiet cascade' },
    { to: 'dailylumen', label: 'daily lumen' },
    { to: 'grovedesk', label: 'grove' },
    { to: 'quietjournal', label: 'journal' },
    { to: 'aetherloom', label: 'aether loom' },
    { to: 'silkharbor', label: 'silk harbor' },
    { to: 'horizonweave', label: 'horizon weave' },
    { to: 'aethercascade', label: 'aether cascade' },
    { to: 'quietpath', label: 'quiet path' },
    { to: 'dawnlumen', label: 'dawn lumen' },
    { to: 'lumenmosaic', label: 'mosaic' },
    { to: 'solsticedesk', label: 'solstice' },
    { to: 'echoloom', label: 'echo loom' },
    { to: 'zenithdesk', label: 'zenith' },
    { to: 'eclipsedesk', label: 'eclipse' },
    { to: 'prismcascade', label: 'prism' },
    { to: 'canvasdesk', label: 'canvas' },
    { to: 'quietweave', label: 'weave' },
    { to: 'glasscascade', label: 'glass cascade' },
    { to: 'velvetharbor', label: 'velvet harbor' },
    { to: 'nimbusdesk', label: 'nimbus' },
    { to: 'latticedesk', label: 'lattice' },
    { to: 'horizondesk', label: 'horizon' },
    { to: 'silkdesk', label: 'silk' },
    { to: 'frostd', label: 'frost' },
    { to: 'lumengallery', label: 'gallery' },
    { to: 'orbitpath', label: 'orbit path' },
    { to: 'gossamerdesk', label: 'gossamer' },
    { to: 'lumenvault', label: 'lumen' },
    { to: 'centraldrop', label: 'central' },
    { to: 'cascade', label: 'cascade' },
    { to: 'ribbon', label: 'ribbon' },
    { to: 'aurorapath', label: 'path' },
    { to: 'drop', label: 'drop' },
    { to: 'forge', label: 'forge' },
    { to: 'aureateforge', label: 'aureate' },
    { to: 'orbitdesk', label: 'orbit' },
    { to: 'rippledesk', label: 'ripple' },
    { to: 'pulsedesk', label: 'pulse' },
    { to: 'signaturedesk', label: 'sign' },
    { to: 'moodboard', label: 'mood' },
    { to: 'whispernote', label: 'whisper' },
    { to: 'nameplatedesk', label: 'nameplate' },
    { to: 'harmonydesk', label: 'harmony' },
    { to: 'softharbor', label: 'harbor' },
    { to: 'board', label: 'board' },
    { to: 'softnexus', label: 'soft nexus' },
    { to: 'studio', label: 'studio' },
    { to: 'wave', label: 'wave' },
    { to: 'prism', label: 'prism old' },
    { to: 'pixeldesk', label: 'pixel' },
    { to: 'quotecard', label: 'quote' },
    { to: 'binder', label: 'binder' },
    { to: 'timelinedesk', label: 'timeline' },
    { to: 'lock', label: 'lock' },
    { to: 'sunrise', label: 'sunrise' },
    { to: 'twilight', label: 'twilight' },
    { to: 'countdown', label: 'countdown' },
    { to: 'linkdesk', label: 'links' },
    { to: 'focus', label: 'focus' },
    { to: 'recipe', label: 'recipe' },
    { to: 'journal', label: 'journal old' },
    { to: 'gradient', label: 'gradient' },
    { to: 'capture', label: 'capture' },
    { to: 'markdowndesk', label: 'markdown' },
    { to: 'voicememo', label: 'voice' },
    { to: 'sketch', label: 'sketch' },
    { to: 'polaroiddesk', label: 'polaroid' },
    { to: 'echodesk', label: 'echo' },
    { to: 'moment', label: 'moment' },
    { to: 'collage', label: 'collage' },
    { to: 'storydesk', label: 'story' },
    { to: 'snippet', label: 'snippet' },
    { to: 'notestudio', label: 'notes' },
    { to: 'lumennote', label: 'lumen note' },
    { to: 'qrdesk', label: 'qr' },
    { to: 'chroma', label: 'chroma' },
    { to: 'particledesk', label: 'particles' },
    { to: 'library', label: 'library' },
    { to: 'explore', label: 'explore' },
    { to: 'insights', label: 'insights' },
    { to: 'directory', label: 'desks' },
    { to: 'home', label: 'home' },
  ];

  return (
    <header className="fixed top-0 inset-x-0 z-50">
      <div className="max-w-5xl mx-auto px-5">
        <motion.nav
          initial={{ y: -12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 140, damping: 22 }}
          className="mt-4 glass rounded-full px-5 py-2.5 flex items-center justify-between"
        >
          <button
            onClick={() => navigate('home')}
            className="text-sm font-semibold tracking-tight text-white"
          >
            rank<span className="text-[#0A84FF]">vault</span>
          </button>

          <div className="hidden md:flex items-center gap-1 overflow-x-auto">
            {links.map((l) => (
              <button
                key={l.to}
                onClick={() => navigate(l.to)}
                className={`px-3.5 py-1.5 rounded-full text-[13px] transition whitespace-nowrap ${route === l.to || (l.to === 'home' && route === 'home') ? 'bg-white/10 text-white' : 'text-neutral-400 hover:text-white'}`}
              >
                {l.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <>
                <span className="hidden sm:inline text-xs text-neutral-500">{user?.username}</span>
                <button onClick={logout} className="text-xs text-neutral-400 hover:text-white">out</button>
              </>
            ) : (
              <button onClick={() => navigate('login')} className="text-xs text-neutral-400 hover:text-white">in</button>
            )}
            <button onClick={() => setOpen(!open)} className="md:hidden text-neutral-400">
              {open ? 'close' : 'menu'}
            </button>
          </div>
        </motion.nav>
        {open && (
          <div className="md:hidden mt-2 glass rounded-3xl p-4 space-y-1">
            {links.map((l) => (
              <button key={l.to} onClick={() => { navigate(l.to); setOpen(false); }} className="block w-full text-left px-3 py-2 text-sm text-neutral-300 hover:text-white rounded-xl">{l.label}</button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
