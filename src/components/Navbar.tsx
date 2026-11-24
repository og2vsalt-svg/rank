import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from './Router';
import { useAuth } from './AuthContext';

export default function Navbar() {
  const { navigate, route } = useRouter();
  const { user, logout, isLoggedIn } = useAuth();
  const [open, setOpen] = useState(false);

  const links = [
    { to: 'drop', label: 'drop' },
    { to: 'forge', label: 'forge' },
    { to: 'aureateforge', label: 'aureate' },
    { to: 'orbitdesk', label: 'orbit' },
    { to: 'quietharbor', label: 'quiet' },
    { to: 'rippledesk', label: 'ripple' },
    { to: 'pulsedesk', label: 'pulse' },
    { to: 'signaturedesk', label: 'sign' },
    { to: 'moodboard', label: 'mood' },
    { to: 'whispernote', label: 'whisper' },
    { to: 'nameplatedesk', label: 'nameplate' },
    { to: 'harmonydesk', label: 'harmony' },
    { to: 'softharbor', label: 'harbor' },
    { to: 'board', label: 'board' },
    { to: 'studio', label: 'studio' },
    { to: 'wave', label: 'wave' },
    { to: 'prism', label: 'prism' },
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
    { to: 'journal', label: 'journal' },
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
    { to: 'lumennote', label: 'lumen' },
    { to: 'qrdesk', label: 'qr' },
    { to: 'chroma', label: 'chroma' },
    { to: 'particledesk', label: 'particles' },
    { to: 'library', label: 'library' },
    { to: 'explore', label: 'explore' },
    { to: 'gallery', label: 'gallery' },
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
                className={`px-3.5 py-1.5 rounded-full text-[13px] transition whitespace-nowrap ${
                  route === l.to || (l.to === 'home' && route === 'home') ? 'bg-white/10 text-white' : 'text-neutral-400 hover:text-white'
                }`}
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
