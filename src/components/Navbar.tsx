import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from './Router';
import { useAuth } from './AuthContext';

export default function Navbar() {
  const { navigate, route } = useRouter();
  const { user, logout, isLoggedIn } = useAuth();
  const [open, setOpen] = useState(false);

  const links = [
    { to: 'drop', label: 'drop' },
    { to: 'echodesk', label: 'echo' },
    { to: 'moment', label: 'moment' },
    { to: 'collage', label: 'collage' },
    { to: 'snippet', label: 'snippet' },
    { to: 'notestudio', label: 'notes' },
    { to: 'qrdesk', label: 'qr' },
    { to: 'chroma', label: 'chroma' },
    { to: 'library', label: 'library' },
    { to: 'explore', label: 'explore' },
    { to: 'gallery', label: 'gallery' },
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
                <button
                  onClick={logout}
                  className="text-xs px-3 py-1.5 rounded-full bg-white/5 text-neutral-300 hover:bg-white/10"
                >
                  out
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate('auth')}
                className="text-xs px-3.5 py-1.5 rounded-full bg-white text-black font-medium"
              >
                sign in
              </button>
            )}
            <button
              className="md:hidden p-1.5"
              onClick={() => setOpen((o) => !o)}
              aria-label="menu"
            >
              <div className="w-4 space-y-1">
                <span className="block h-px bg-white/70" />
                <span className="block h-px bg-white/70" />
                <span className="block h-px bg-white/70" />
              </div>
            </button>
          </div>
        </motion.nav>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="md:hidden mt-2 glass rounded-3xl p-3 space-y-1"
            >
              {links.map((l) => (
                <button
                  key={l.to}
                  onClick={() => {
                    navigate(l.to);
                    setOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 rounded-xl text-sm text-neutral-300 hover:bg-white/5"
                >
                  {l.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
