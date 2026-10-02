import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

export type Route = string;

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

function parseLocation() {
  const pathName = window.location.pathname.replace(/\/+$/, '');
  const parts = pathName.split('/').filter(Boolean);
  const raw = window.location.hash.replace('#', '');
  const [path, qs] = raw.split('?');
  const params = new URLSearchParams(qs || window.location.search.replace(/^\?/, ''));
  const slug = (path || '').replace(/[^a-z0-9/_-]/gi, '').toLowerCase();
  if (slug === 'share' || slug.startsWith('file/')) {
    return { route: 'share', shareId: params.get('f') || slug.replace('file/', '') };
  }
  if (params.get('f') && !slug) return { route: 'share', shareId: params.get('f') };
  if (slug) return { route: slug, shareId: params.get('f') };
  if (parts.length >= 2 && ['s', 'f', 'open', 'go', 'link', 'card'].includes(parts[0])) {
    return { route: 'share', shareId: decodeURIComponent(parts[1]) };
  }
  if (parts.length === 1 && parts[0] !== 'index.html') {
    return { route: parts[0].toLowerCase(), shareId: null };
  }
  return { route: 'home', shareId: null };
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(() => parseLocation());

  useEffect(() => {
    const handler = () => setState(parseLocation());
    window.addEventListener('hashchange', handler);
    window.addEventListener('popstate', handler);
    return () => {
      window.removeEventListener('hashchange', handler);
      window.removeEventListener('popstate', handler);
    };
  }, []);

  const navigate = useCallback((to: Route, extra?: string) => {
    if (to === 'home') {
      history.pushState(null, '', window.location.pathname);
      window.location.hash = '';
      setState({ route: 'home', shareId: null });
    } else if ((to === 'share' || to === 'paste' || to === 'clip' || to === 'inlet') && extra) {
      window.location.hash = `${to}?f=${extra}`;
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
