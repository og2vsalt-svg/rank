import { AuthProvider } from './components/AuthContext';
import { RouterProvider, useRouter } from './components/Router';
import { VaultProvider } from './components/VaultContext';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import FAQ from './components/FAQ';
import Footer from './components/Footer';

const pageModules = import.meta.glob('./components/*Page.tsx', { eager: true }) as Record<
  string,
  { default?: any }
>;

const pages: Record<string, any> = {};
for (const [path, mod] of Object.entries(pageModules)) {
  const file = path.split('/').pop() || '';
  const name = file.replace(/Page\.tsx$/, '');
  if (!name || !mod?.default) continue;
  pages[name.toLowerCase()] = mod.default;
}

function Shell() {
  const { route } = useRouter();
  const Page = pages[route];
  if (Page) return <Page />;
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
