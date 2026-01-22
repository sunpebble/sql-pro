import { Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import About from './components/About';
import Download from './components/Download';
import Features from './components/Features';
import Footer from './components/Footer';
import Hero from './components/Hero';
import LanguageSwitcher from './components/LanguageSwitcher';
import Pricing from './components/Pricing';
import SkipLink from './components/SkipLink';
import Testimonials from './components/Testimonials';

function Loading() {
  return (
    <div className="loading" role="status" aria-live="polite">
      <div className="loading-spinner" aria-hidden="true" />
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export default function App() {
  const { t } = useTranslation();

  return (
    <Suspense fallback={<Loading />}>
      <SkipLink />
      <LanguageSwitcher />
      <main id="main-content" role="main" aria-label={t('meta.title')}>
        <Hero />
        <About />
        <Features />
        <Testimonials />
        <Pricing />
        <Download />
      </main>
      <Footer />
    </Suspense>
  );
}
