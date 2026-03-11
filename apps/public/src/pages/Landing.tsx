import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Scale, ShieldCheck, Database, Users, BookOpen, FlaskConical, MessageCircle } from 'lucide-react';

export function Landing() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoEnded, setVideoEnded] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Force video play — Safari blocks autoplay even when muted
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    const tryPlay = () => {
      video.play().catch(() => {
        // Retry once on user interaction
        const handler = () => {
          video.play().catch(() => {});
          document.removeEventListener('click', handler);
          document.removeEventListener('scroll', handler);
          document.removeEventListener('touchstart', handler);
        };
        document.addEventListener('click', handler, { once: true });
        document.addEventListener('scroll', handler, { once: true });
        document.addEventListener('touchstart', handler, { once: true });
      });
    };
    if (video.readyState >= 3) {
      tryPlay();
    } else {
      video.addEventListener('canplay', tryPlay, { once: true });
    }
  }, []);

  return (
    <div className="min-h-screen bg-white text-black font-body selection:bg-[#21B2AA] selection:text-white overflow-x-hidden">

      {/* Global grain texture */}
      <div className="fixed inset-0 pointer-events-none z-[100] bg-noise opacity-[0.025] mix-blend-multiply" />

      {/* HEADER */}
      <header
        className={`fixed top-0 w-full z-50 px-6 md:px-12 transition-all duration-100 flex items-center justify-between ${
          scrolled
            ? 'py-4 bg-white/95 border-b border-black'
            : 'py-8 bg-transparent'
        }`}
      >
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate('/')}>
          <span className="font-bold tracking-[0.15em] text-xs uppercase text-black" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
            Dataring
          </span>
        </div>

        <nav className="flex items-center gap-8 text-xs font-mono tracking-[0.1em] uppercase">
          <button
            onClick={() => navigate('/citizen/login')}
            className="hidden sm:block text-black/40 hover:text-black border-b border-transparent hover:border-black transition-colors duration-100"
          >
            Connexion
          </button>
          <button
            onClick={() => navigate('/citizen/register')}
            className="px-6 py-3 bg-black text-white text-[11px] font-medium tracking-[0.15em] uppercase hover:bg-white hover:text-black border-2 border-black transition-colors duration-100 focus-visible:outline focus-visible:outline-3 focus-visible:outline-black focus-visible:outline-offset-3"
          >
            Rejoindre
          </button>
        </nav>
      </header>

      <main className="relative z-10">

        {/* ═══════════════════════════════════════════
            1. HERO
            ═══════════════════════════════════════════ */}
        <section className="relative min-h-screen flex items-center overflow-hidden">
          {/* Video background */}
          <div className="absolute inset-0 z-0">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              preload="auto"
              onEnded={() => setVideoEnded(true)}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ objectPosition: 'right center' }}
            >
              <source src="/assets/hero-charcoal.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
          </div>

          <div className="relative z-10 w-full px-6 md:px-12 lg:px-20 pt-32 pb-20">
            <div className="max-w-3xl">
              <div className="flex items-center gap-4 mb-12">
                <span className="w-12 h-[2px] bg-[#21B2AA]" />
                <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-black/50">
                  Académie Dataring
                </span>
              </div>

              <h1 className="font-bold text-5xl sm:text-6xl lg:text-7xl xl:text-8xl tracking-tighter leading-[0.9] mb-8" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
                IA, Esprit critique<br />
                <span className="italic font-normal">& Souveraineté</span><br />
                décisionnelle.
              </h1>

              <p className="max-w-2xl text-lg sm:text-xl text-black/50 font-light leading-relaxed mb-14">
                Former des dirigeants, juristes, data leaders et managers à utiliser l'IA à haut niveau
                <strong className="text-black font-medium"> sans perdre le jugement, les compétences ni la responsabilité humaine</strong>.
              </p>

              <div className="flex flex-col sm:flex-row items-start gap-4">
                <button
                  onClick={() => document.getElementById('ecoles')?.scrollIntoView({ behavior: 'smooth' })}
                  className="group inline-flex items-center gap-4 px-8 py-4 bg-black text-white text-[11px] font-medium tracking-[0.2em] uppercase hover:bg-white hover:text-black border-2 border-black transition-colors duration-100 focus-visible:outline focus-visible:outline-3 focus-visible:outline-black focus-visible:outline-offset-3"
                >
                  Découvrir les parcours
                  <ArrowRight size={16} strokeWidth={1.5} className="group-hover:translate-x-1 transition-transform duration-100" />
                </button>
                <button
                  onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                  className="inline-flex items-center gap-4 px-8 py-4 bg-transparent text-black text-[11px] font-medium tracking-[0.2em] uppercase border-2 border-black hover:bg-black hover:text-white transition-colors duration-100 focus-visible:outline focus-visible:outline-3 focus-visible:outline-black focus-visible:outline-offset-3"
                >
                  Parler à un expert
                </button>
              </div>

              <p className="mt-10 font-mono text-[10px] tracking-[0.1em] text-black/30 uppercase max-w-lg">
                Une académie adossée au Lab IA de Dataring — cas réels, régulation européenne, retours de terrain.
              </p>
            </div>
          </div>
        </section>

        <div className="h-[4px] bg-black" />

        {/* ═══════════════════════════════════════════
            2. À QUI S'ADRESSE L'ACADÉMIE
            ═══════════════════════════════════════════ */}
        <section className="relative py-24 md:py-32 lg:py-40 px-6 md:px-12 lg:px-20">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, #000 1px, #000 2px)',
              backgroundSize: '100% 4px',
              opacity: 0.012,
            }}
          />

          <div className="relative max-w-6xl mx-auto">
            <div className="mb-16 max-w-2xl">
              <span className="font-mono text-[10px] tracking-[0.3em] text-[#21B2AA]/60 uppercase block mb-6">Cibles</span>
              <h2 className="font-bold text-4xl sm:text-5xl tracking-tighter leading-[0.95] mb-6" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
                Pour celles et ceux qui décident…<br />
                <span className="italic font-normal">et devront répondre de leurs décisions.</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0">
              {[
                {
                  icon: Users,
                  title: 'Dirigeants / COMEX / CODIR',
                  text: 'Arbitrer entre innovation, risque et souveraineté de décision.',
                },
                {
                  icon: Scale,
                  title: 'Juristes, DPO, conformité',
                  text: 'Mettre l\'IA en conformité avec AI Act, RGPD, NIS2, DORA.',
                },
                {
                  icon: Database,
                  title: 'CDO, CISO, data & produit',
                  text: 'Concevoir des systèmes IA gouvernés, explicables, robustes.',
                },
                {
                  icon: ShieldCheck,
                  title: 'Managers opérationnels',
                  text: 'Utiliser l\'IA sans laisser s\'atrophier les compétences des équipes.',
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className={`group p-8 transition-colors duration-100 hover:bg-black hover:text-white border-b border-black lg:border-b-0 ${
                    i < 3 ? 'lg:border-r lg:border-black' : ''
                  }`}
                >
                  <item.icon size={24} strokeWidth={1.5} className="mb-6 text-black group-hover:text-white transition-colors duration-100" />
                  <h3 className="font-bold text-lg tracking-tight mb-3 transition-colors duration-100" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
                    {item.title}
                  </h3>
                  <p className="text-black/50 group-hover:text-white/60 text-sm leading-relaxed transition-colors duration-100">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="h-[4px] bg-black" />

        {/* ═══════════════════════════════════════════
            3. NOS TROIS ÉCOLES
            ═══════════════════════════════════════════ */}
        <section id="ecoles" className="relative py-24 md:py-32 lg:py-40 px-6 md:px-12 lg:px-20">
          <div className="max-w-6xl mx-auto">
            <div className="mb-20 max-w-2xl">
              <span className="font-mono text-[10px] tracking-[0.3em] text-[#21B2AA]/60 uppercase block mb-6">Écoles</span>
              <h2 className="font-bold text-4xl sm:text-5xl tracking-tighter leading-[0.95]" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
                Trois écoles, une même ambition :<br />
                <span className="italic font-normal">remettre l'humain au centre de l'IA.</span>
              </h2>
            </div>

            <div className="space-y-0">
              {/* École 1 */}
              <div className="group border-t-[2px] border-black py-12 md:py-16 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
                <div className="md:col-span-1">
                  <span className="font-mono text-[10px] tracking-[0.3em] text-[#21B2AA]/50">01.</span>
                </div>
                <div className="md:col-span-5">
                  <h3 className="font-bold text-2xl sm:text-3xl tracking-tight mb-3" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
                    Esprit critique & décisions assistées par IA
                  </h3>
                  <p className="text-black/40 italic text-lg font-display">
                    « Penser avec l'IA, sans penser comme l'IA. »
                  </p>
                </div>
                <div className="md:col-span-5">
                  <ul className="space-y-3 text-black/60 text-sm leading-relaxed mb-8">
                    <li className="flex gap-3"><span className="w-1.5 h-1.5 bg-[#21B2AA] rounded-full mt-2 shrink-0" />Biais humains vs biais de modèles</li>
                    <li className="flex gap-3"><span className="w-1.5 h-1.5 bg-[#21B2AA] rounded-full mt-2 shrink-0" />Désapprentissage organisationnel</li>
                    <li className="flex gap-3"><span className="w-1.5 h-1.5 bg-[#21B2AA] rounded-full mt-2 shrink-0" />Rituels de décision et contre-pouvoirs internes</li>
                  </ul>
                  <button className="text-[11px] font-medium tracking-[0.15em] uppercase border-b-2 border-black pb-1 hover:bg-black hover:text-white hover:px-4 hover:py-2 hover:border-transparent transition-all duration-100">
                    Voir les modules « Esprit critique »
                  </button>
                </div>
                <div className="md:col-span-1" />
              </div>

              {/* École 2 */}
              <div className="group border-t-[2px] border-black py-12 md:py-16 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
                <div className="md:col-span-1">
                  <span className="font-mono text-[10px] tracking-[0.3em] text-[#21B2AA]/50">02.</span>
                </div>
                <div className="md:col-span-5">
                  <h3 className="font-bold text-2xl sm:text-3xl tracking-tight mb-3" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
                    Droit, conformité & gouvernance de l'IA
                  </h3>
                  <p className="text-black/40 italic text-lg font-display">
                    « Transformer AI Act, RGPD, NIS2, DORA en leviers de maîtrise. »
                  </p>
                </div>
                <div className="md:col-span-5">
                  <ul className="space-y-3 text-black/60 text-sm leading-relaxed mb-8">
                    <li className="flex gap-3"><span className="w-1.5 h-1.5 bg-[#21B2AA] rounded-full mt-2 shrink-0" />Décisions automatisées, article 22 RGPD</li>
                    <li className="flex gap-3"><span className="w-1.5 h-1.5 bg-[#21B2AA] rounded-full mt-2 shrink-0" />Systèmes à haut risque et AI Act</li>
                    <li className="flex gap-3"><span className="w-1.5 h-1.5 bg-[#21B2AA] rounded-full mt-2 shrink-0" />Gouvernance, registres, comités IA</li>
                  </ul>
                  <button className="text-[11px] font-medium tracking-[0.15em] uppercase border-b-2 border-black pb-1 hover:bg-black hover:text-white hover:px-4 hover:py-2 hover:border-transparent transition-all duration-100">
                    Voir les modules « Gouvernance & Régulation »
                  </button>
                </div>
                <div className="md:col-span-1" />
              </div>

              {/* École 3 */}
              <div className="group border-t-[2px] border-black border-b-[2px] py-12 md:py-16 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
                <div className="md:col-span-1">
                  <span className="font-mono text-[10px] tracking-[0.3em] text-[#21B2AA]/50">03.</span>
                </div>
                <div className="md:col-span-5">
                  <h3 className="font-bold text-2xl sm:text-3xl tracking-tight mb-3" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
                    Interface homme-machine & capital humain
                  </h3>
                  <p className="text-black/40 italic text-lg font-display">
                    « Concevoir des interactions IA qui augmentent la compétence, pas qui la remplacent. »
                  </p>
                </div>
                <div className="md:col-span-5">
                  <ul className="space-y-3 text-black/60 text-sm leading-relaxed mb-8">
                    <li className="flex gap-3"><span className="w-1.5 h-1.5 bg-[#21B2AA] rounded-full mt-2 shrink-0" />Design d'interfaces IA (explicabilité, incertitude, confiance)</li>
                    <li className="flex gap-3"><span className="w-1.5 h-1.5 bg-[#21B2AA] rounded-full mt-2 shrink-0" />Répartition des rôles humain / IA</li>
                    <li className="flex gap-3"><span className="w-1.5 h-1.5 bg-[#21B2AA] rounded-full mt-2 shrink-0" />IA comme outil de formation in situ</li>
                  </ul>
                  <button className="text-[11px] font-medium tracking-[0.15em] uppercase border-b-2 border-black pb-1 hover:bg-black hover:text-white hover:px-4 hover:py-2 hover:border-transparent transition-all duration-100">
                    Voir les modules « Interface & Capital humain »
                  </button>
                </div>
                <div className="md:col-span-1" />
              </div>
            </div>
          </div>
        </section>

        <div className="h-[4px] bg-black" />

        {/* ═══════════════════════════════════════════
            4. COMMENT FONCTIONNE L'ACADÉMIE
            ═══════════════════════════════════════════ */}
        <section className="relative py-24 md:py-32 lg:py-40 px-6 md:px-12 lg:px-20">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 40px, #00000008 40px, #00000008 42px)',
              opacity: 0.5,
            }}
          />

          <div className="relative max-w-6xl mx-auto">
            <div className="mb-16 max-w-2xl">
              <span className="font-mono text-[10px] tracking-[0.3em] text-[#21B2AA]/60 uppercase block mb-6">Formats</span>
              <h2 className="font-bold text-4xl sm:text-5xl tracking-tighter leading-[0.95]" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
                Une académie,<br />
                <span className="italic font-normal">trois formats complémentaires.</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
              {[
                {
                  icon: BookOpen,
                  title: 'Parcours certifiants',
                  text: 'Programmes structurés pour dirigeants, juristes / DPO, data & produit. Cas pratiques, évaluation finale, certification Dataring.',
                },
                {
                  icon: FlaskConical,
                  title: 'Studios & Labs',
                  text: 'Sprints d\'expérimentation sur vos cas réels : revue d\'un process RH, d\'une interface IA, d\'une gouvernance métier. Adossé au Lab IA Dataring.',
                },
                {
                  icon: MessageCircle,
                  title: 'Clubs de pairs',
                  text: 'Espaces « Esprit critique & IA », « Interface homme-machine », « Régulation & IA » : échanges confidentiels entre responsables confrontés aux mêmes dilemmes.',
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className={`group p-8 md:p-10 transition-colors duration-100 hover:bg-black hover:text-white ${
                    i < 2 ? 'md:border-r md:border-black' : ''
                  } ${i < 2 ? 'border-b md:border-b-0 border-black' : ''}`}
                >
                  <item.icon size={24} strokeWidth={1.5} className="mb-6 text-black group-hover:text-white transition-colors duration-100" />
                  <h3 className="font-bold text-xl tracking-tight mb-4 transition-colors duration-100" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
                    {item.title}
                  </h3>
                  <p className="text-black/50 group-hover:text-white/60 text-sm leading-relaxed transition-colors duration-100">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <button className="px-8 py-4 border-2 border-black text-black text-[11px] font-medium tracking-[0.2em] uppercase hover:bg-black hover:text-white transition-colors duration-100 focus-visible:outline focus-visible:outline-3 focus-visible:outline-black focus-visible:outline-offset-3">
                Télécharger le catalogue des programmes
              </button>
            </div>
          </div>
        </section>

        <div className="h-[4px] bg-black" />

        {/* ═══════════════════════════════════════════
            5. ANCRAGE LAB IA
            ═══════════════════════════════════════════ */}
        <section className="relative py-24 md:py-32 lg:py-40 px-6 md:px-12 lg:px-20 bg-black text-white overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 1px, #fff 1px, #fff 2px)',
              backgroundSize: '4px 100%',
              opacity: 0.02,
            }}
          />

          <div className="relative max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
              <div className="lg:col-span-7">
                <span className="font-mono text-[10px] tracking-[0.3em] text-[#21B2AA]/70 uppercase block mb-6">Lab IA</span>
                <h2 className="font-bold text-4xl sm:text-5xl tracking-tighter leading-[0.95] mb-10" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
                  Une académie adossée à un Lab IA,<br />
                  <span className="italic font-normal">pas à des slides théoriques.</span>
                </h2>

                <ul className="space-y-6 text-white/60 text-base leading-relaxed">
                  <li className="flex gap-4">
                    <span className="w-6 h-[2px] bg-white/30 mt-3 shrink-0" />
                    <span>Cas d'usage issus des missions du Lab IA (anonymisés)</span>
                  </li>
                  <li className="flex gap-4">
                    <span className="w-6 h-[2px] bg-white/30 mt-3 shrink-0" />
                    <span>Veille continue sur AI Act, RGPD, cybersécurité, jurisprudence</span>
                  </li>
                  <li className="flex gap-4">
                    <span className="w-6 h-[2px] bg-white/30 mt-3 shrink-0" />
                    <span>Expérimentations encadrées : simulations de décisions assistées, tests d'interfaces, exercices de « red teaming » cognitif</span>
                  </li>
                </ul>
              </div>

              <div className="lg:col-span-5 flex items-center">
                <div className="border-2 border-white/20 p-8 lg:p-10">
                  <p className="text-white/50 text-base leading-relaxed italic font-display">
                    « Vous avez déjà un projet IA en cours ? L'Académie peut s'appuyer dessus comme fil rouge pédagogique. »
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="h-[4px] bg-black" />

        {/* ═══════════════════════════════════════════
            6. PARCOURS PHARES
            ═══════════════════════════════════════════ */}
        <section className="relative py-24 md:py-32 lg:py-40 px-6 md:px-12 lg:px-20">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(#00000008 1px, transparent 1px), linear-gradient(90deg, #00000008 1px, transparent 1px)',
              backgroundSize: '40px 40px',
              opacity: 0.8,
            }}
          />

          <div className="relative max-w-6xl mx-auto">
            <div className="mb-16 max-w-2xl">
              <span className="font-mono text-[10px] tracking-[0.3em] text-[#21B2AA]/60 uppercase block mb-6">Parcours</span>
              <h2 className="font-bold text-4xl sm:text-5xl tracking-tighter leading-[0.95]" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
                Des parcours pensés<br />
                <span className="italic font-normal">pour vos responsabilités.</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
              {[
                {
                  num: '01',
                  title: 'Décideurs & IA',
                  objective: 'Construire une stratégie IA qui renforce — et non affaiblit — la capacité de décision du COMEX.',
                },
                {
                  num: '02',
                  title: 'Juristes / DPO & IA',
                  objective: 'Sécuriser les décisions automatisées au regard de l\'AI Act, du RGPD et de la cybersécurité.',
                },
                {
                  num: '03',
                  title: 'Data / Produit & IA',
                  objective: 'Concevoir des systèmes IA explicables, gouvernés, acceptables par les métiers.',
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className={`group p-8 md:p-10 border-2 border-black transition-colors duration-100 hover:bg-black hover:text-white ${
                    i < 2 ? 'md:border-r-0' : ''
                  } ${i > 0 ? 'border-t-0 md:border-t-2' : ''}`}
                >
                  <span className="font-mono text-[10px] tracking-[0.3em] text-black/30 group-hover:text-white/40 block mb-6 transition-colors duration-100">
                    {item.num}.
                  </span>
                  <h3 className="font-bold text-xl tracking-tight mb-4 transition-colors duration-100" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
                    Parcours « {item.title} »
                  </h3>
                  <p className="text-black/50 group-hover:text-white/60 text-sm leading-relaxed mb-8 transition-colors duration-100">
                    {item.objective}
                  </p>
                  <button className="text-[11px] font-medium tracking-[0.15em] uppercase border-b-2 border-current pb-1 group-hover:text-white transition-colors duration-100">
                    Demander la fiche détaillée <span className="inline-block ml-1">→</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="h-[4px] bg-black" />

        {/* ═══════════════════════════════════════════
            7. RÉSULTATS POUR VOTRE ORGANISATION
            ═══════════════════════════════════════════ */}
        <section className="relative py-24 md:py-32 lg:py-40 px-6 md:px-12 lg:px-20">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
              <div className="lg:col-span-5">
                <span className="font-mono text-[10px] tracking-[0.3em] text-[#21B2AA]/60 uppercase block mb-6">Résultats</span>
                <h2 className="font-bold text-4xl sm:text-5xl tracking-tighter leading-[0.95]" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
                  Ce que vos équipes sauront faire<br />
                  <span className="italic font-normal">après l'Académie.</span>
                </h2>
              </div>

              <div className="lg:col-span-7">
                <ul className="space-y-0">
                  {[
                    'Identifier les décisions qui peuvent être partiellement automatisées… et celles qui ne doivent pas l\'être.',
                    'Concevoir des circuits de validation où l\'humain garde un vrai pouvoir de contestation.',
                    'Documenter les décisions IA pour répondre demain à un régulateur ou à un juge.',
                    'Détecter les signaux faibles de désapprentissage dans les équipes.',
                    'Dialoguer efficacement entre COMEX, juridique, data, IT et métiers sur les enjeux IA.',
                  ].map((item, i) => (
                    <li key={i} className="flex gap-4 py-5 border-b border-black/10 last:border-b-0">
                      <span className="font-mono text-[10px] tracking-[0.3em] text-[#21B2AA]/40 mt-1 shrink-0">
                        {String(i + 1).padStart(2, '0')}.
                      </span>
                      <span className="text-black/70 text-base leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <div className="h-[4px] bg-black" />

        {/* ═══════════════════════════════════════════
            8. MODALITÉS & PROCHAIN DÉPART
            ═══════════════════════════════════════════ */}
        <section className="relative py-24 md:py-32 lg:py-40 px-6 md:px-12 lg:px-20 bg-[#F5F5F5]">
          <div className="max-w-6xl mx-auto">
            <div className="mb-16 max-w-2xl">
              <span className="font-mono text-[10px] tracking-[0.3em] text-[#21B2AA]/60 uppercase block mb-6">Inscription</span>
              <h2 className="font-bold text-4xl sm:text-5xl tracking-tighter leading-[0.95]" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
                Prochains départs<br />
                <span className="italic font-normal">et modalités.</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-2 border-black bg-white">
              <div className="p-8 md:p-10 md:border-r border-b md:border-b-0 border-black">
                <ul className="space-y-5 text-base">
                  <li className="flex justify-between border-b border-black/10 pb-4">
                    <span className="text-black/50 text-sm font-mono tracking-wide uppercase">Cohorte « Décideurs & IA »</span>
                    <span className="font-bold text-sm" style={{ fontFamily: "'Inter Tight', sans-serif" }}>Septembre 2026</span>
                  </li>
                  <li className="flex justify-between border-b border-black/10 pb-4">
                    <span className="text-black/50 text-sm font-mono tracking-wide uppercase">Cohorte « Juristes / DPO & IA »</span>
                    <span className="font-bold text-sm" style={{ fontFamily: "'Inter Tight', sans-serif" }}>Octobre 2026</span>
                  </li>
                  <li className="flex justify-between border-b border-black/10 pb-4">
                    <span className="text-black/50 text-sm font-mono tracking-wide uppercase">Format</span>
                    <span className="text-sm">Hybride (live + en ligne)</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-black/50 text-sm font-mono tracking-wide uppercase">Langue</span>
                    <span className="text-sm">Français (anglais sur demande)</span>
                  </li>
                </ul>
              </div>

              <div className="p-8 md:p-10 flex flex-col justify-center gap-4">
                <button className="w-full px-8 py-4 bg-black text-white text-[11px] font-medium tracking-[0.2em] uppercase hover:bg-white hover:text-black border-2 border-black transition-colors duration-100 focus-visible:outline focus-visible:outline-3 focus-visible:outline-black focus-visible:outline-offset-3">
                  Planifier un échange de cadrage
                </button>
                <button className="w-full px-8 py-4 bg-transparent text-black text-[11px] font-medium tracking-[0.2em] uppercase border-2 border-black hover:bg-black hover:text-white transition-colors duration-100 focus-visible:outline focus-visible:outline-3 focus-visible:outline-black focus-visible:outline-offset-3">
                  Pré-inscrire mon organisation
                </button>
              </div>
            </div>
          </div>
        </section>

        <div className="h-[4px] bg-black" />

        {/* ═══════════════════════════════════════════
            9. CTA FINAL
            ═══════════════════════════════════════════ */}
        <section id="contact" className="relative py-32 md:py-40 lg:py-48 px-6 bg-black text-white overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle at top center, #ffffff, transparent 70%)',
              opacity: 0.04,
            }}
          />

          <div className="relative z-10 max-w-3xl mx-auto text-center">
            <div className="flex justify-center mb-12">
              <div className="w-16 h-[2px] bg-[#21B2AA]/50" />
            </div>

            <h2 className="font-bold text-4xl sm:text-5xl lg:text-6xl tracking-tighter leading-[0.95] mb-8" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
              Prêt à former des décideurs augmentés…<br />
              <span className="italic font-normal">mais pas dépossédés ?</span>
            </h2>

            <p className="text-lg sm:text-xl text-white/40 font-light leading-relaxed mb-14 max-w-2xl mx-auto">
              L'IA ne va pas tuer l'économie. Elle peut, en revanche, fragiliser nos organisations si elle érode le jugement, la compétence et la responsabilité.
              L'Académie Dataring est là pour éviter ce scénario.
            </p>

            <button className="px-10 py-4 border-2 border-white text-white text-[11px] font-medium tracking-[0.2em] uppercase hover:bg-white hover:text-black transition-colors duration-100 focus-visible:outline focus-visible:outline-3 focus-visible:outline-white focus-visible:outline-offset-3">
              Être recontacté par l'équipe DataRing
            </button>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            FOOTER
            ═══════════════════════════════════════════ */}
        <footer className="border-t-[4px] border-black bg-white py-10 px-6 md:px-12 lg:px-20">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <span className="font-mono text-[10px] tracking-[0.2em] text-black/40 uppercase">
              Dataring © {new Date().getFullYear()}
            </span>
            <div className="flex items-center gap-10 font-mono text-[10px] tracking-[0.15em] text-black/40 uppercase">
              <span className="hover:text-black border-b border-transparent hover:border-black transition-colors duration-100 cursor-pointer">
                Mentions Légales
              </span>
              <span className="hover:text-black border-b border-transparent hover:border-black transition-colors duration-100 cursor-pointer">
                Contact
              </span>
            </div>
            <span className="font-mono text-[10px] tracking-[0.2em] text-[#21B2AA]/60 uppercase">
              Académie & Lab IA
            </span>
          </div>
        </footer>

      </main>
    </div>
  );
}

export default Landing;
