import { AuthProvider } from './components/AuthContext';
import { RouterProvider, useRouter } from './components/Router';
import { VaultProvider } from './components/VaultContext';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import VaultPage from './components/VaultPage';
import SharePage from './components/SharePage';
import NotesPage from './components/NotesPage';
import PastePage from './components/PastePage';
import DropPage from './components/DropPage';
import StatusPage from './components/StatusPage';
import ConvertPage from './components/ConvertPage';
import QrPage from './components/QrPage';
import ClipPage from './components/ClipPage';
import HashPage from './components/HashPage';
import PalettePage from './components/PalettePage';
import PulsePage from './components/PulsePage';

function Shell() {
  const { route } = useRouter();

  if (route === 'login') return <LoginPage />;
  if (route === 'signup') return <SignupPage />;
  if (route === 'vault') return <VaultPage />;
  if (route === 'share') return <SharePage />;
  if (route === 'notes') return <NotesPage />;
  if (route === 'paste') return <PastePage />;
  if (route === 'drop') return <DropPage />;
  if (route === 'status') return <StatusPage />;
  if (route === 'convert') return <ConvertPage />;
  if (route === 'qr') return <QrPage />;
  if (route === 'clip') return <ClipPage />;
  if (route === 'hash') return <HashPage />;
  if (route === 'palette') return <PalettePage />;
  if (route === 'pulse') return <PulsePage />;

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
