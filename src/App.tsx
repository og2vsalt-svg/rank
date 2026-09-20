import { AuthProvider } from './components/AuthContext';
import { CartProvider } from './components/CartContext';
import { RouterProvider, useRouter } from './components/Router';
import { VaultProvider } from './components/VaultContext';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import BoostTypes from './components/BoostTypes';
import PricingTabs from './components/PricingTabs';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import Cart from './components/Cart';
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
        <BoostTypes />
        <PricingTabs />
        <FAQ />
      </main>
      <Footer />
      <Cart />
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
