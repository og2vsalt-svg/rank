import { lazy, Suspense } from 'react';
import { AuthProvider } from './components/AuthContext';
import { RouterProvider, useRouter } from './components/Router';
import { VaultProvider } from './components/VaultContext';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import FAQ from './components/FAQ';
import Footer from './components/Footer';

const pageLoaders = import.meta.glob('./components/*Page.tsx') as Record<
  string,
  () => Promise<{ default?: any }>
>;

const pages: Record<string, any> = {};
for (const [path, loader] of Object.entries(pageLoaders)) {
  const file = path.split('/').pop() || '';
  const name = file.replace(/Page\.tsx$/, '');
  if (!name) continue;
  pages[name.toLowerCase()] = lazy(loader);
}

function Shell() {
  const { route } = useRouter();
  const Page = pages[route];
  if (Page) {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen grid place-items-center bg-[#0b0b0d] text-sm text-neutral-500">
            opening…
          </div>
        }
      >
        <Page />
      </Suspense>
    );
  }
  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <RouterProvider>
      <AuthProvider>
        <VaultProvider>
          <Shell />
        </VaultProvider>
      </AuthProvider>
    </RouterProvider>
  );
}
