import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

export type Route = 'home' | 'login' | 'signup' | 'vault';

interface RouterContextType {
  route: Route;
  navigate: (to: Route) => void;
}

const RouterContext = createContext<RouterContextType | null>(null);

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouter must be inside RouterProvider');
  return ctx;
}

function getRouteFromHash(): Route {
  const hash = window.location.hash.replace('#', '').split('?')[0];
  if (hash === 'login') return 'login';
  if (hash === 'signup') return 'signup';
  if (hash === 'vault' || hash.startsWith('file/')) return 'vault';
  return 'home';
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<Route>(() => getRouteFromHash());

  useEffect(() => {
    const handler = () => setRoute(getRouteFromHash());
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const navigate = useCallback((to: Route) => {
    if (to === 'home') {
      history.pushState(null, '', window.location.pathname);
      setRoute('home');
    } else {
      window.location.hash = to;
    }
  }, []);

  return (
    <RouterContext.Provider value={{ route, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}
