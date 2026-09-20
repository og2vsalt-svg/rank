import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

export type Route = 'home' | 'login' | 'signup' | 'vault' | 'share';

interface RouterContextType {
  route: Route;
  shareId: string | null;
  navigate: (to: Route, extra?: string) => void;
}

const RouterContext = createContext<RouterContextType | null>(null);

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouter must be inside RouterProvider');
  return ctx;
}

function parseHash() {
  const raw = window.location.hash.replace('#', '');
  const [path, qs] = raw.split('?');
  const params = new URLSearchParams(qs || '');
  if (path === 'login') return { route: 'login' as Route, shareId: null };
  if (path === 'signup') return { route: 'signup' as Route, shareId: null };
  if (path === 'vault') return { route: 'vault' as Route, shareId: params.get('f') };
  if (path === 'share' || path.startsWith('file/')) {
    return { route: 'share' as Route, shareId: params.get('f') || path.replace('file/', '') };
  }
  if (params.get('f')) return { route: 'share' as Route, shareId: params.get('f') };
  return { route: 'home' as Route, shareId: null };
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(() => parseHash());

  useEffect(() => {
    const handler = () => setState(parseHash());
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const navigate = useCallback((to: Route, extra?: string) => {
    if (to === 'home') {
      history.pushState(null, '', window.location.pathname);
      setState({ route: 'home', shareId: null });
    } else if (to === 'share' && extra) {
      window.location.hash = `share?f=${extra}`;
    } else {
      window.location.hash = to;
    }
  }, []);

  return (
    <RouterContext.Provider value={{ route: state.route, shareId: state.shareId, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}
