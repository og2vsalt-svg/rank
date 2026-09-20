import { AuthProvider } from './components/AuthContext';
import { CartProvider } from './components/CartContext';
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

function Shell() {
  const { route } = useRouter();

  if (route === 'login') return <LoginPage />;
  if (route === 'signup') return <SignupPage />;
  if (route === 'vault') return <VaultPage />;
  if (route === 'share') return <SharePage />;

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
        <CartProvider>
          <VaultProvider>
            <Shell />
          </VaultProvider>
        </CartProvider>
      </AuthProvider>
    </RouterProvider>
  );
}
