import type { Metadata } from 'next';
import { AudienceSection } from '@/components/home/Audiencesection';
import { AuthRedirect } from '@/components/home/AuthRedirect';
import { Benefits } from '@/components/home/Benefits';
import { FAQ } from '@/components/home/Faq';
import { Features } from '@/components/home/Features';
import { FinalCTA } from '@/components/home/Finalcta';
import { Footer } from '@/components/home/Footer';
import { Hero } from '@/components/home/Hero';
import { HowItWorks } from '@/components/home/Howitworks';
import { LanguageProvider } from '@/components/home/LanguageProvider';
import { MotionProvider } from '@/components/home/Motionprovider';
import { Navbar } from '@/components/home/Navbar';
import { PrivacySection } from '@/components/home/Privacysection';

const TITLE = 'WellMind — Bien-être au travail';
const DESCRIPTION =
  'WellMind aide les organisations à comprendre le bien-être de leurs employés grâce à des sondages, une analyse des retours et des actions d’amélioration.';

// SEO : titre, description et aperçu pour le partage sur les réseaux (Open Graph)
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: 'website',
    locale: 'fr_FR',
    siteName: 'WellMind',
  },
};

// Composant serveur : assemble les sections. La langue et les animations
// sont gérées dans les composants client (LanguageProvider, MotionProvider).
export default function HomePage() {
  return (
    <LanguageProvider>
      <MotionProvider>
        <AuthRedirect />
        <Navbar />
        <main>
          <Hero />
          <Benefits />
          <Features />
          <HowItWorks />
          <AudienceSection />
          <PrivacySection />
          <FAQ />
          <FinalCTA />
        </main>
        <Footer />
      </MotionProvider>
    </LanguageProvider>
  );
}