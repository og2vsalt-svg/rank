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
import DiffPage from './components/DiffPage';
import TimerPage from './components/TimerPage';
import InspectPage from './components/InspectPage';
import ZipPage from './components/ZipPage';
import LinksPage from './components/LinksPage';
import MarkdownPage from './components/MarkdownPage';
import GalleryPage from './components/GalleryPage';
import TransferPage from './components/TransferPage';
import RecordPage from './components/RecordPage';
import CountPage from './components/CountPage';
import UnitsPage from './components/UnitsPage';
import JsonPage from './components/JsonPage';
import BoardPage from './components/BoardPage';
import StashPage from './components/StashPage';
import SnapshotPage from './components/SnapshotPage';
import SketchPage from './components/SketchPage';
import EchoPage from './components/EchoPage';
import LoomPage from './components/LoomPage';
import SplitPage from './components/SplitPage';
import BeaconPage from './components/BeaconPage';
import WeavePage from './components/WeavePage';
import AuraPage from './components/AuraPage';
import CipherPage from './components/CipherPage';
import PrismPage from './components/PrismPage';
import FluxPage from './components/FluxPage';
import OrbitPage from './components/OrbitPage';
import SignalPage from './components/SignalPage';
import TidyPage from './components/TidyPage';
import QuayPage from './components/QuayPage';
import LensPage from './components/LensPage';
import DriftPage from './components/DriftPage';
import CompassPage from './components/CompassPage';
import KeepPage from './components/KeepPage';
import HarborPage from './components/HarborPage';

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
  if (route === 'diff') return <DiffPage />;
  if (route === 'timer') return <TimerPage />;
  if (route === 'inspect') return <InspectPage />;
  if (route === 'zip') return <ZipPage />;
  if (route === 'links') return <LinksPage />;
  if (route === 'markdown') return <MarkdownPage />;
  if (route === 'gallery') return <GalleryPage />;
  if (route === 'transfer') return <TransferPage />;
  if (route === 'record') return <RecordPage />;
  if (route === 'count') return <CountPage />;
  if (route === 'units') return <UnitsPage />;
  if (route === 'json') return <JsonPage />;
  if (route === 'board') return <BoardPage />;
  if (route === 'stash') return <StashPage />;
  if (route === 'snapshot') return <SnapshotPage />;
  if (route === 'sketch') return <SketchPage />;
  if (route === 'echo') return <EchoPage />;
  if (route === 'loom') return <LoomPage />;
  if (route === 'split') return <SplitPage />;
  if (route === 'beacon') return <BeaconPage />;
  if (route === 'weave') return <WeavePage />;
  if (route === 'aura') return <AuraPage />;
  if (route === 'cipher') return <CipherPage />;
  if (route === 'prism') return <PrismPage />;
  if (route === 'flux') return <FluxPage />;
  if (route === 'orbit') return <OrbitPage />;
  if (route === 'signal') return <SignalPage />;
  if (route === 'tidy') return <TidyPage />;
  if (route === 'quay') return <QuayPage />;
  if (route === 'lens') return <LensPage />;
  if (route === 'drift') return <DriftPage />;
  if (route === 'compass') return <CompassPage />;
  if (route === 'keep') return <KeepPage />;
  if (route === 'harbor') return <HarborPage />;

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
