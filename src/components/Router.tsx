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

const SHARE_PREFIX = new Set(['s', 'f', 'open', 'go', 'link', 'card']);

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
  if (parts.length >= 2 && SHARE_PREFIX.has(parts[0])) {
    return { route: 'share', shareId: decodeURIComponent(parts[1]) };
  }
  if (parts.length >= 2 && parts[0] === 'parcel') {
    return { route: 'hawse', shareId: decodeURIComponent(parts[1]) };
  }
  if (parts.length >= 2) {
    return { route: parts[0].toLowerCase(), shareId: decodeURIComponent(parts[1]) };
  }
  if (parts.length === 1 && parts[0] !== 'index.html') {
    return { route: parts[0].toLowerCase(), shareId: params.get('f') };
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
      history.pushState(null, '', '/');
      setState({ route: 'home', shareId: null });
      return;
    }
    const hash = extra ? `${to}?f=${extra}` : to;
    history.pushState(null, '', `/#${hash}`);
    setState({ route: to, shareId: extra || null });
  }, []);

  return (
    <RouterContext.Provider value={{ route: state.route, shareId: state.shareId, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}
