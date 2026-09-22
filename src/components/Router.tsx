import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

export type Route = 'home' | 'login' | 'signup' | 'vault' | 'share' | 'notes' | 'paste' | 'drop' | 'status' | 'convert' | 'qr' | 'clip' | 'hash' | 'palette' | 'pulse' | 'diff' | 'timer' | 'inspect' | 'zip' | 'links' | 'markdown' | 'gallery' | 'transfer' | 'record' | 'count' | 'units' | 'json' | 'board' | 'stash' | 'snapshot' | 'sketch' | 'echo' | 'loom' | 'split' | 'beacon' | 'weave' | 'aura' | 'cipher' | 'prism' | 'flux' | 'orbit' | 'signal' | 'tidy' | 'quay' | 'lens' | 'drift' | 'compass' | 'keep' | 'harbor' | 'folio' | 'relay' | 'mirror' | 'atlas' | 'parcel' | 'studio' | 'whisper' | 'glide' | 'nook' | 'ember' | 'gauge' | 'tide' | 'grove' | 'spark' | 'courier' | 'lantern' | 'capsule' | 'ripple' | 'haven' | 'well' | 'onyx' | 'bridge' | 'willow' | 'spire' | 'lark' | 'dew' | 'moss' | 'kiln' | 'flint' | 'cove' | 'vale' | 'hearth' | 'quill' | 'ridge' | 'forge' | 'lumen' | 'meadow' | 'anvil' | 'nexus' | 'veil' | 'shelf' | 'reel' | 'pact' | 'wick' | 'bloom' | 'dusk' | 'crate' | 'slate';

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

const known: Route[] = ['login', 'signup', 'vault', 'share', 'notes', 'paste', 'drop', 'status', 'convert', 'qr', 'clip', 'hash', 'palette', 'pulse', 'diff', 'timer', 'inspect', 'zip', 'links', 'markdown', 'gallery', 'transfer', 'record', 'count', 'units', 'json', 'board', 'stash', 'snapshot', 'sketch', 'echo', 'loom', 'split', 'beacon', 'weave', 'aura', 'cipher', 'prism', 'flux', 'orbit', 'signal', 'tidy', 'quay', 'lens', 'drift', 'compass', 'keep', 'harbor', 'folio', 'relay', 'mirror', 'atlas', 'parcel', 'studio', 'whisper', 'glide', 'nook', 'ember', 'gauge', 'tide', 'grove', 'spark', 'courier', 'lantern', 'capsule', 'ripple', 'haven', 'well', 'onyx', 'bridge', 'willow', 'spire', 'lark', 'dew', 'moss', 'kiln', 'flint', 'cove', 'vale', 'hearth', 'quill', 'ridge', 'forge', 'lumen', 'meadow', 'anvil', 'nexus', 'veil', 'shelf', 'reel', 'pact', 'wick', 'bloom', 'dusk', 'crate', 'slate'];

function parseHash() {
  const raw = window.location.hash.replace('#', '');
  const [path, qs] = raw.split('?');
  const params = new URLSearchParams(qs || '');
  if (path === 'share' || path.startsWith('file/')) {
    return { route: 'share' as Route, shareId: params.get('f') || path.replace('file/', '') };
  }
  if (known.includes(path as Route)) return { route: path as Route, shareId: params.get('f') };
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
    } else if ((to === 'share' || to === 'paste' || to === 'clip') && extra) {
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
