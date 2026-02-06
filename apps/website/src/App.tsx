import { Suspense, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Account from './components/Account';
import Download from './components/Download';
import FAQ from './components/FAQ';
import Features from './components/Features';
import Footer from './components/Footer';
import Hero from './components/Hero';
import LicenseModal from './components/LicenseModal';
import OpenSource from './components/OpenSource';
import Screenshots from './components/Screenshots';
import SkipLink from './components/SkipLink';
import Stats from './components/Stats';
import Testimonials from './components/Testimonials';
import TopBar from './components/TopBar';

function Loading() {
  return (
    <div className="loading" role="status" aria-live="polite">
      <div className="loading-spinner" aria-hidden="true" />
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export default function App() {
  const { t, i18n } = useTranslation();
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [showAccount, setShowAccount] = useState(false);

  // Sync document title and meta description with current language
  useEffect(() => {
    document.title = t('meta.title');

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', t('meta.description'));
    }

    // Update html lang attribute
    document.documentElement.lang = i18n.language === 'zh' ? 'zh-CN' : 'en';
  }, [t, i18n.language]);

  // Check for checkout success and account page in URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkoutStatus = params.get('checkout');
    const page = params.get('page');

    if (checkoutStatus === 'success') {
      // Show the license lookup modal after successful purchase
      setShowLicenseModal(true);
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }

    if (page === 'account') {
      setShowAccount(true);
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Listen for custom event to open account page
  useEffect(() => {
    function handleOpenAccount() {
      setShowAccount(true);
    }

    window.addEventListener('openAccountPage', handleOpenAccount);
    return () =>
      window.removeEventListener('openAccountPage', handleOpenAccount);
  }, []);

  // Show Account page
  if (showAccount) {
    return (
      <Suspense fallback={<Loading />}>
        <Account onClose={() => setShowAccount(false)} />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<Loading />}>
      <SkipLink />
      <TopBar />
      <main id="main-content" role="main" aria-label={t('meta.title')}>
        <Hero />
        <Stats />
        <Features />
        <Screenshots />
        <Testimonials />
        <OpenSource />
        <FAQ />
        <Download />
      </main>
      <Footer />

      {/* License lookup modal - shown after successful checkout */}
      <LicenseModal
        isOpen={showLicenseModal}
        onClose={() => setShowLicenseModal(false)}
      />
    </Suspense>
  );
}
