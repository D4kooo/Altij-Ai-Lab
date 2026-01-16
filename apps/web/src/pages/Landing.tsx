import { useState, useEffect, useCallback, Suspense, lazy, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  ArrowRight,
  ArrowDown,
  Menu,
  X,
  Heart,
  Shield,
  Scale,
  Users,
  Globe,
  Sparkles,
  MapPin,
  Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useScrollProgress } from '@/hooks/useScrollProgress';
import CustomCursor from '@/components/landing/CustomCursor';

gsap.registerPlugin(ScrollTrigger);

// Lazy load the WebGL canvas
const WebGLCanvas = lazy(() => import('@/components/landing/WebGLCanvas'));

const SECTION_COUNT = 6;
const SECTION_IDS = ['hero', 'expertise', 'enjeu', 'souverainete', 'donation', 'cta'];

// Donation amounts
const DONATION_AMOUNTS = [
  { value: 5, label: '5€', afterTax: '1,70€' },
  { value: 15, label: '15€', afterTax: '5,10€' },
  { value: 30, label: '30€', afterTax: '10,20€' },
  { value: 0, label: 'Libre', afterTax: '' },
];

export function Landing() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState<number | null>(15);

  // Scroll progress based on which section is centered in viewport
  const { totalProgress, currentSection, continuousProgress } = useScrollProgress({
    sectionCount: SECTION_COUNT,
    sectionIds: SECTION_IDS,
  });

  // Setup GSAP scroll-linked animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero animations - reveal on load
      gsap.fromTo('.hero-content > *',
        { opacity: 0, y: 60, filter: 'blur(10px)' },
        {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          stagger: 0.12,
          duration: 1,
          delay: 0.3,
          ease: 'power3.out',
        }
      );

      // Setup scrub animations for each section
      // Section 2: Expertise
      gsap.fromTo('#expertise .reveal-item',
        { opacity: 0, y: 80, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          stagger: 0.1,
          scrollTrigger: {
            trigger: '#expertise',
            start: 'top 70%',
            end: 'top 20%',
            scrub: 1,
          }
        }
      );

      // Section 3: Enjeu
      gsap.fromTo('#enjeu .reveal-item',
        { opacity: 0, y: 80, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          stagger: 0.1,
          scrollTrigger: {
            trigger: '#enjeu',
            start: 'top 70%',
            end: 'top 20%',
            scrub: 1,
          }
        }
      );

      // Section 4: Souveraineté
      gsap.fromTo('#souverainete .reveal-item',
        { opacity: 0, y: 80, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          stagger: 0.1,
          scrollTrigger: {
            trigger: '#souverainete',
            start: 'top 70%',
            end: 'top 20%',
            scrub: 1,
          }
        }
      );

      // Section 5: Donation
      gsap.fromTo('#donation .reveal-item',
        { opacity: 0, y: 80, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          stagger: 0.1,
          scrollTrigger: {
            trigger: '#donation',
            start: 'top 70%',
            end: 'top 20%',
            scrub: 1,
          }
        }
      );

      // Section 6: CTA
      gsap.fromTo('#cta .reveal-item',
        { opacity: 0, y: 80, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          stagger: 0.1,
          scrollTrigger: {
            trigger: '#cta',
            start: 'top 70%',
            end: 'top 20%',
            scrub: 1,
          }
        }
      );

    }, containerRef);

    return () => ctx.revert();
  }, []);

  const scrollToSection = useCallback((sectionIndex: number) => {
    const sections = ['hero', 'expertise', 'enjeu', 'souverainete', 'donation', 'cta'];
    const element = document.getElementById(sections[sectionIndex]);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  }, []);

  return (
    <div ref={containerRef} className="landing-immersive min-h-screen bg-landing-bg text-landing-text overflow-x-hidden">
      {/* Custom Cursor (desktop only) */}
      <CustomCursor />

      {/* WebGL Background */}
      <Suspense fallback={<div className="webgl-fixed-canvas bg-landing-bg" />}>
        <WebGLCanvas
          continuousProgress={continuousProgress}
        />
      </Suspense>

      {/* Scroll Progress Bar */}
      <div className="scroll-progress">
        <div
          className="scroll-progress-bar"
          style={{ transform: `scaleX(${totalProgress})` }}
        />
      </div>

      {/* Navigation Dots */}
      <nav className="nav-dots hidden md:flex" aria-label="Navigation sections">
        {Array.from({ length: SECTION_COUNT }).map((_, index) => (
          <button
            key={index}
            className={`nav-dot hoverable ${currentSection === index ? 'active' : ''}`}
            onClick={() => scrollToSection(index)}
            aria-label={`Section ${index + 1}`}
          />
        ))}
      </nav>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-landing-bg/70 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <img
                src="/assets/logo-dataring-black.png"
                alt="DataRing"
                className="h-8 w-auto invert"
              />
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              <button
                onClick={() => scrollToSection(1)}
                className="text-landing-text-muted hover:text-landing-accent transition-colors font-medium hoverable"
              >
                Expertise
              </button>
              <button
                onClick={() => scrollToSection(2)}
                className="text-landing-text-muted hover:text-landing-accent transition-colors font-medium hoverable"
              >
                Mission
              </button>
              <button
                onClick={() => scrollToSection(4)}
                className="text-landing-text-muted hover:text-landing-accent transition-colors font-medium hoverable"
              >
                Soutenir
              </button>
            </nav>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Button
                variant="ghost"
                className="text-landing-text-muted hover:text-landing-text hover:bg-white/5 hoverable"
                onClick={() => navigate('/login')}
              >
                Connexion
              </Button>
              <Button
                className="bg-landing-accent hover:bg-landing-accent/90 text-landing-bg font-semibold hoverable"
                onClick={() => navigate('/citizen/register')}
              >
                Commencer
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-landing-text"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-landing-bg/95 backdrop-blur-xl border-t border-white/5 px-4 py-4 space-y-4">
            <button onClick={() => scrollToSection(1)} className="block w-full text-left text-landing-text-muted py-2">
              Expertise
            </button>
            <button onClick={() => scrollToSection(2)} className="block w-full text-left text-landing-text-muted py-2">
              Mission
            </button>
            <button onClick={() => scrollToSection(4)} className="block w-full text-left text-landing-text-muted py-2">
              Soutenir
            </button>
            <div className="pt-4 space-y-2 border-t border-white/10">
              <Button variant="outline" className="w-full border-white/20 text-landing-text" onClick={() => navigate('/login')}>
                Connexion
              </Button>
              <Button className="w-full bg-landing-accent text-landing-bg" onClick={() => navigate('/citizen/register')}>
                Commencer
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* ============================================
          SECTION 1: HERO
          ============================================ */}
      <section id="hero" className="min-h-screen flex items-center justify-center relative pt-16">
        <div className="section-content hero-content text-center max-w-4xl mx-auto px-4">
          {/* Badge */}
          <div className="mb-8" style={{ opacity: 0 }}>
            <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-landing-accent/10 text-landing-accent text-sm font-medium border border-landing-accent/20 backdrop-blur-sm">
              <Award className="h-4 w-4" />
              Association d'Intérêt Général · Depuis 2017
            </span>
          </div>

          {/* Main Title */}
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold mb-8 leading-[1.1]" style={{ opacity: 0 }}>
            Reprenez le contrôle
            <br />
            <span className="text-landing-accent">de vos données</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl sm:text-2xl text-landing-text-muted max-w-2xl mx-auto mb-12 leading-relaxed" style={{ opacity: 0 }}>
            Collectif d'expertise juridique et numérique dédié à la protection
            des libertés publiques et de la souveraineté numérique.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4" style={{ opacity: 0 }}>
            <button
              className="btn-mint-glow text-lg px-10 py-5 hoverable"
              onClick={() => navigate('/citizen/register')}
            >
              Démarrer l'expérience
              <ArrowRight className="inline ml-2 h-5 w-5" />
            </button>
            <Button
              variant="outline"
              size="lg"
              className="border-white/20 text-landing-text hover:bg-white/5 text-lg px-8 h-14 hoverable"
              onClick={() => scrollToSection(1)}
            >
              Découvrir
            </Button>
          </div>

          {/* Trust Points */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-8" style={{ opacity: 0 }}>
            {[
              { icon: Shield, text: 'Open Source' },
              { icon: Scale, text: 'RGPD natif' },
              { icon: Heart, text: 'Non lucratif' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2 text-landing-text-muted">
                <item.icon className="h-5 w-5 text-landing-accent" />
                <span className="font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <button
            onClick={() => scrollToSection(1)}
            className="flex flex-col items-center gap-2 text-landing-text-muted hover:text-landing-accent transition-colors hoverable"
          >
            <span className="text-xs uppercase tracking-widest">Scroll</span>
            <ArrowDown className="h-5 w-5 animate-bounce" />
          </button>
        </div>
      </section>

      {/* ============================================
          SECTION 2: EXPERTISE
          ============================================ */}
      <section id="expertise" className="min-h-screen flex items-center justify-center py-24">
        <div className="section-content max-w-5xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="reveal-item text-landing-accent font-medium text-sm uppercase tracking-wider">
              Notre expertise
            </span>
            <h2 className="reveal-item font-display text-4xl sm:text-5xl lg:text-6xl font-bold mt-4 mb-6">
              Un Collectif d'<span className="text-landing-accent">Experts</span>
            </h2>
            <p className="reveal-item text-xl text-landing-text-muted max-w-2xl mx-auto">
              Avocats, universitaires et ingénieurs réunis pour défendre vos droits numériques.
            </p>
          </div>

          {/* Expertise Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Scale,
                title: 'Droit des données',
                description: 'Experts en droit des données personnelles, RGPD et libertés publiques.',
              },
              {
                icon: Sparkles,
                title: 'Intelligence Artificielle',
                description: 'Éthique de l\'IA, audit algorithmique et protection contre les biais.',
              },
              {
                icon: Shield,
                title: 'Cybersécurité',
                description: 'Protection technique et juridique de votre patrimoine numérique.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="reveal-item bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-landing-accent/30 hover:bg-white/[0.05] transition-all duration-500 hoverable"
              >
                <div className="w-14 h-14 rounded-xl bg-landing-accent/10 flex items-center justify-center mb-6">
                  <item.icon className="h-7 w-7 text-landing-accent" />
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-landing-text-muted">{item.description}</p>
              </div>
            ))}
          </div>

          {/* Values Tags */}
          <div className="reveal-item flex flex-wrap items-center justify-center gap-4 mt-12">
            {['Transparence', 'Loyauté', 'Souveraineté'].map((value) => (
              <span
                key={value}
                className="px-6 py-2.5 rounded-full border border-landing-accent/30 text-landing-accent font-medium hover:bg-landing-accent/10 transition-colors hoverable"
              >
                {value}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          SECTION 3: ENJEU CITOYEN
          ============================================ */}
      <section id="enjeu" className="min-h-screen flex items-center justify-center py-24">
        <div className="section-content max-w-4xl mx-auto px-4">
          <div className="text-center">
            <span className="reveal-item text-landing-accent font-medium text-sm uppercase tracking-wider">
              L'enjeu citoyen
            </span>
            <h2 className="reveal-item font-display text-4xl sm:text-5xl lg:text-6xl font-bold mt-4 mb-6">
              L'<span className="text-landing-accent">Autodétermination</span>
              <br />Informationnelle
            </h2>
            <p className="reveal-item text-xl text-landing-text-muted mb-16 max-w-2xl mx-auto">
              Être citoyen de ses données pour résister à la servilité volontaire
              et aux discriminations algorithmiques.
            </p>

            {/* Key Points */}
            <div className="grid sm:grid-cols-2 gap-6 text-left max-w-3xl mx-auto">
              {[
                {
                  icon: Users,
                  title: 'Égalité de représentation',
                  description: 'Lutter contre les biais et discriminations systémiques dans les systèmes d\'IA.',
                },
                {
                  icon: Globe,
                  title: 'Recherche responsable',
                  description: 'Promouvoir une innovation numérique éthique, inclusive et au service du bien commun.',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="reveal-item flex items-start gap-4 p-6 bg-white/[0.03] rounded-xl border border-white/10 hover:border-landing-accent/20 transition-all duration-300 hoverable"
                >
                  <div className="w-12 h-12 rounded-lg bg-landing-accent/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="h-6 w-6 text-landing-accent" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                    <p className="text-landing-text-muted">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          SECTION 4: SOUVERAINETÉ
          ============================================ */}
      <section id="souverainete" className="min-h-screen flex items-center justify-center py-24">
        <div className="section-content max-w-4xl mx-auto px-4 text-center">
          <span className="reveal-item text-landing-accent font-medium text-sm uppercase tracking-wider">
            Souveraineté numérique
          </span>
          <h2 className="reveal-item font-display text-4xl sm:text-5xl lg:text-6xl font-bold mt-4 mb-6">
            Souveraineté des <span className="text-landing-accent">Territoires</span>
          </h2>
          <p className="reveal-item text-xl text-landing-text-muted mb-16 max-w-2xl mx-auto">
            Offrir des alternatives locales face aux géants internationaux
            dans la nouvelle économie de la data.
          </p>

          {/* Features */}
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { icon: MapPin, title: 'Hébergement FR', desc: 'Données souveraines en France' },
              { icon: Shield, title: 'RSE Numérique', desc: 'Responsabilité éthique et sociale' },
              { icon: Globe, title: 'Open Source', desc: 'Code transparent et auditable' },
            ].map((item) => (
              <div key={item.title} className="reveal-item p-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-landing-accent/10 flex items-center justify-center mx-auto mb-6 hover:scale-110 transition-transform duration-300">
                  <item.icon className="h-8 w-8 text-landing-accent" />
                </div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-landing-text-muted">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          SECTION 5: DONATION
          ============================================ */}
      <section id="donation" className="min-h-screen flex items-center justify-center py-24">
        <div className="section-content max-w-2xl mx-auto px-4">
          <div className="reveal-item bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-8 sm:p-12">
            <div className="text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-landing-accent/20 to-landing-accent/5 flex items-center justify-center mx-auto mb-8">
                <Heart className="h-10 w-10 text-landing-accent" />
              </div>

              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                Soutenez notre <span className="text-landing-accent">mission</span>
              </h2>

              <p className="text-landing-text-muted mb-8 text-lg">
                Data Ring est une association d'intérêt général.
                <br />
                <strong className="text-landing-text">Vos dons sont déductibles à 66% de vos impôts.</strong>
              </p>

              {/* Donation Amounts */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                {DONATION_AMOUNTS.map((amount) => (
                  <button
                    key={amount.value}
                    className={`donation-amount-btn hoverable ${selectedDonation === amount.value ? 'selected' : ''}`}
                    onClick={() => setSelectedDonation(amount.value)}
                  >
                    <span className="text-2xl font-bold block">{amount.label}</span>
                    {amount.afterTax && (
                      <span className="text-xs text-landing-text-muted mt-1 block">
                        soit {amount.afterTax}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Custom Amount Input */}
              {selectedDonation === 0 && (
                <div className="mb-8">
                  <input
                    type="number"
                    placeholder="Montant en euros"
                    className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-center text-landing-text text-xl focus:border-landing-accent focus:outline-none transition-colors"
                    min="1"
                  />
                </div>
              )}

              {/* Donate Button */}
              <button className="btn-mint-glow w-full sm:w-auto text-lg px-12 py-5 hoverable">
                <Heart className="inline mr-2 h-5 w-5" />
                Faire un don
              </button>

              {/* Tax Info */}
              <p className="mt-8 text-sm text-landing-text-subtle">
                {selectedDonation && selectedDonation > 0 ? (
                  <>
                    Un don de <strong className="text-landing-text">{selectedDonation}€</strong> ne vous coûte que{' '}
                    <strong className="text-landing-accent">
                      {(selectedDonation * 0.34).toFixed(2)}€
                    </strong>{' '}
                    après réduction d'impôt
                  </>
                ) : (
                  'Chaque don compte pour protéger vos libertés numériques'
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          SECTION 6: CTA
          ============================================ */}
      <section id="cta" className="min-h-screen flex items-center justify-center py-24">
        <div className="section-content text-center max-w-4xl mx-auto px-4">
          <h2 className="reveal-item font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold mb-8 leading-tight">
            Rejoignez une union
            <br />
            <span className="text-landing-accent">citoyenne et participative</span>
          </h2>

          <p className="reveal-item text-xl sm:text-2xl text-landing-text-muted max-w-2xl mx-auto mb-12">
            Agissez pour l'intérêt général. Ensemble, construisons une alternative
            numérique éthique et souveraine.
          </p>

          <div className="reveal-item flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              className="btn-mint-glow text-lg sm:text-xl px-12 py-6 hoverable"
              onClick={() => navigate('/citizen/register')}
            >
              Démarrer l'expérience
              <ArrowRight className="inline ml-2 h-5 w-5" />
            </button>
            <Button
              variant="outline"
              size="lg"
              className="border-white/20 text-landing-text hover:bg-white/5 text-lg px-8 h-14 hoverable"
              onClick={() => scrollToSection(4)}
            >
              <Heart className="mr-2 h-5 w-5" />
              Faire un don
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-12 bg-landing-bg/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img
                src="/assets/logo-dataring-black.png"
                alt="DataRing"
                className="h-6 w-auto invert opacity-50"
              />
              <span className="text-landing-text-subtle text-sm">
                © 2017-2026 Association Data Ring
              </span>
            </div>

            <div className="flex items-center gap-6 text-landing-text-subtle text-sm">
              <a href="#" className="hover:text-landing-text transition-colors hoverable">
                Mentions légales
              </a>
              <a href="#" className="hover:text-landing-text transition-colors hoverable">
                Confidentialité
              </a>
              <a href="#" className="hover:text-landing-text transition-colors hoverable">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
