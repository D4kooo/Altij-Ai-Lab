import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Scale, ShieldCheck, Database, Users, BookOpen, FlaskConical, MessageCircle, Baby, GraduationCap, Heart, Smartphone, FileText, AlertTriangle } from 'lucide-react';

type Mode = 'org' | 'particulier';

export function Landing() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mode, setMode] = useState<Mode>('org');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    const tryPlay = () => {
      video.play().catch(() => {
        const handler = () => { video.play().catch(() => {}); document.removeEventListener('click', handler); document.removeEventListener('scroll', handler); };
        document.addEventListener('click', handler, { once: true });
        document.addEventListener('scroll', handler, { once: true });
      });
    };
    if (video.readyState >= 3) tryPlay();
    else video.addEventListener('canplay', tryPlay, { once: true });
  }, []);

  // ─── Content variants ──────────────────────────────────────────────

  const hero = {
    org: {
      badge: 'Académie Dataring',
      title: <>IA, Esprit critique<br /><span className="italic font-normal">& Souveraineté</span><br />décisionnelle.</>,
      subtitle: <>Former des dirigeants, juristes, data leaders et managers à utiliser l'IA à haut niveau <strong className="text-black font-medium">sans perdre le jugement, les compétences ni la responsabilité humaine</strong>.</>,
      cta: 'Découvrir les parcours',
      cta2: 'Parler à un expert',
      footnote: 'Une académie adossée au Lab IA de Dataring — cas réels, régulation européenne, retours de terrain.',
    },
    particulier: {
      badge: 'Espace Citoyen Dataring',
      title: <>Vos données,<br /><span className="italic font-normal">vos droits,</span><br />votre protection.</>,
      subtitle: <>Apprenez à exercer vos droits numériques, protéger vos données personnelles et <strong className="text-black font-medium">comprendre l'IA qui impacte votre quotidien</strong>.</>,
      cta: 'Commencer gratuitement',
      cta2: 'Voir les outils',
      footnote: 'Des cours interactifs, des outils concrets et une communauté pour défendre vos droits numériques.',
    },
  };

  const audience = {
    org: [
      { icon: Users, title: 'Dirigeants / COMEX / CODIR', text: 'Arbitrer entre innovation, risque et souveraineté de décision.' },
      { icon: Scale, title: 'Juristes, DPO, conformité', text: 'Mettre l\'IA en conformité avec AI Act, RGPD, NIS2, DORA.' },
      { icon: Database, title: 'CDO, CISO, data & produit', text: 'Concevoir des systèmes IA gouvernés, explicables, robustes.' },
      { icon: ShieldCheck, title: 'Managers opérationnels', text: 'Utiliser l\'IA sans laisser s\'atrophier les compétences des équipes.' },
    ],
    particulier: [
      { icon: Users, title: 'Adultes & professionnels', text: 'Comprendre vos droits RGPD et reprendre le contrôle sur vos données personnelles.' },
      { icon: GraduationCap, title: 'Étudiants & jeunes', text: 'Apprendre à naviguer en sécurité, détecter les manipulations et protéger votre identité numérique.' },
      { icon: Heart, title: 'Seniors', text: 'Maîtriser les bases du numérique en toute confiance, à votre rythme.' },
      { icon: Baby, title: 'Parents', text: 'Protéger vos enfants en ligne et les éduquer aux bonnes pratiques numériques.' },
    ],
  };

  const schools = {
    org: [
      { num: '01', title: 'Esprit critique & décisions assistées par IA', quote: '« Penser avec l\'IA, sans penser comme l\'IA. »', items: ['Biais humains vs biais de modèles', 'Désapprentissage organisationnel', 'Rituels de décision et contre-pouvoirs internes'], cta: 'Voir les modules « Esprit critique »' },
      { num: '02', title: 'Droit, conformité & gouvernance de l\'IA', quote: '« Transformer AI Act, RGPD, NIS2, DORA en leviers de maîtrise. »', items: ['Décisions automatisées, article 22 RGPD', 'Systèmes à haut risque et AI Act', 'Gouvernance, registres, comités IA'], cta: 'Voir les modules « Gouvernance & Régulation »' },
      { num: '03', title: 'Interface homme-machine & capital humain', quote: '« Concevoir des interactions IA qui augmentent la compétence, pas qui la remplacent. »', items: ['Design d\'interfaces IA (explicabilité, incertitude, confiance)', 'Répartition des rôles humain / IA', 'IA comme outil de formation in situ'], cta: 'Voir les modules « Interface & Capital humain »' },
    ],
    particulier: [
      { num: '01', title: 'Droits numériques & RGPD', quote: '« Vos données vous appartiennent. Apprenez à les récupérer. »', items: ['Droit d\'accès, de rectification et d\'effacement', 'Générer une lettre RGPD en 2 clics', 'Comprendre les CGU des services que vous utilisez'], cta: 'Accéder aux outils RGPD' },
      { num: '02', title: 'Sécurité numérique au quotidien', quote: '« Protéger sa vie numérique, c\'est aussi simple que de fermer sa porte. »', items: ['Mots de passe, double authentification, phishing', 'Vérifier si vos données ont été compromises', 'Sécuriser vos appareils et vos comptes'], cta: 'Voir le parcours sécurité' },
      { num: '03', title: 'Comprendre l\'IA qui vous entoure', quote: '« L\'IA n\'est pas magique. Comprendre ses mécanismes, c\'est garder le pouvoir. »', items: ['Comment fonctionne une IA générative (ChatGPT, etc.)', 'Bulles de filtre et recommandations algorithmiques', 'Fake news, deepfakes et manipulation de l\'information'], cta: 'Voir le parcours IA' },
    ],
  };

  const formats = {
    org: [
      { icon: BookOpen, title: 'Parcours certifiants', text: 'Programmes structurés pour dirigeants, juristes / DPO, data & produit. Cas pratiques, évaluation finale, certification Dataring.' },
      { icon: FlaskConical, title: 'Studios & Labs', text: 'Sprints d\'expérimentation sur vos cas réels : revue d\'un process RH, d\'une interface IA, d\'une gouvernance métier.' },
      { icon: MessageCircle, title: 'Clubs de pairs', text: 'Espaces d\'échanges confidentiels entre responsables confrontés aux mêmes dilemmes IA.' },
    ],
    particulier: [
      { icon: Smartphone, title: 'Cours interactifs', text: 'Des parcours adaptés à votre niveau (juniors, adultes, seniors) avec quiz, vidéos et badges de progression.' },
      { icon: FileText, title: 'Outils pratiques', text: 'Générateur de lettres RGPD, analyseur de CGU par IA, alertes de fuites de données — utilisables immédiatement.' },
      { icon: AlertTriangle, title: 'Actions collectives', text: 'Rejoignez des campagnes citoyennes pour défendre vos droits numériques auprès des plateformes et des régulateurs.' },
    ],
  };

  const results = {
    org: [
      'Identifier les décisions qui peuvent être partiellement automatisées… et celles qui ne doivent pas l\'être.',
      'Concevoir des circuits de validation où l\'humain garde un vrai pouvoir de contestation.',
      'Documenter les décisions IA pour répondre demain à un régulateur ou à un juge.',
      'Détecter les signaux faibles de désapprentissage dans les équipes.',
      'Dialoguer efficacement entre COMEX, juridique, data, IT et métiers sur les enjeux IA.',
    ],
    particulier: [
      'Exercer vos droits d\'accès, de rectification et d\'effacement auprès de n\'importe quelle entreprise.',
      'Analyser les CGU des services que vous utilisez et comprendre ce que vous acceptez vraiment.',
      'Vérifier si vos données personnelles ont été exposées lors d\'une fuite de données.',
      'Reconnaître une tentative de phishing, un deepfake ou une manipulation algorithmique.',
      'Protéger la vie numérique de vos enfants et de vos proches vulnérables.',
    ],
  };

  const h = hero[mode];
  const a = audience[mode];
  const s = schools[mode];
  const f = formats[mode];
  const r = results[mode];

  return (
    <div className="min-h-screen bg-white text-black font-body selection:bg-[#21B2AA] selection:text-white overflow-x-hidden">

      <div className="fixed inset-0 pointer-events-none z-[100] bg-noise opacity-[0.025] mix-blend-multiply" />

      {/* HEADER */}
      <header className={`fixed top-0 w-full z-50 px-6 md:px-12 transition-all duration-100 flex items-center justify-between ${scrolled ? 'py-4 bg-white/95 border-b border-black' : 'py-8 bg-transparent'}`}>
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate('/')}>
          <span className="font-bold tracking-[0.15em] text-xs uppercase text-black" style={{ fontFamily: "'Inter Tight', sans-serif" }}>Dataring</span>
        </div>

        <nav className="flex items-center gap-8 text-xs font-mono tracking-[0.1em] uppercase">
          <button onClick={() => navigate('/citizen/login')} className="hidden sm:block text-black/40 hover:text-black border-b border-transparent hover:border-black transition-colors duration-100">
            Connexion
          </button>
          <button onClick={() => navigate('/citizen/register')} className="px-6 py-3 bg-black text-white text-[11px] font-medium tracking-[0.15em] uppercase hover:bg-white hover:text-black border-2 border-black transition-colors duration-100">
            Rejoindre
          </button>
        </nav>
      </header>

      <main className="relative z-10">

        {/* 1. HERO */}
        <section className="relative min-h-screen flex items-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <video ref={videoRef} autoPlay muted playsInline preload="auto" className="absolute inset-0 w-full h-full object-cover" style={{ objectPosition: 'right center' }}>
              <source src="/assets/hero-charcoal.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
          </div>

          <div className="relative z-10 w-full px-6 md:px-12 lg:px-20 pt-32 pb-20">
            <div className="max-w-3xl">

              {/* ─── MODE TOGGLE ─── */}
              <div className="flex items-center gap-3 mb-12">
                <div className="inline-flex items-center bg-black/5 rounded-full p-1 gap-0">
                  <button
                    onClick={() => setMode('org')}
                    className={`px-5 py-2 text-[11px] font-medium tracking-[0.1em] uppercase rounded-full transition-all duration-200 ${
                      mode === 'org' ? 'bg-black text-white' : 'text-black/40 hover:text-black/70'
                    }`}
                  >
                    Organisation
                  </button>
                  <button
                    onClick={() => setMode('particulier')}
                    className={`px-5 py-2 text-[11px] font-medium tracking-[0.1em] uppercase rounded-full transition-all duration-200 ${
                      mode === 'particulier' ? 'bg-black text-white' : 'text-black/40 hover:text-black/70'
                    }`}
                  >
                    Particulier
                  </button>
                </div>
              </div>

              <div key={mode + '-badge'} className="hero-text-enter flex items-center gap-4 mb-8">
                <span className="w-12 h-[2px] bg-[#21B2AA]" />
                <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-black/50">{h.badge}</span>
              </div>

              <h1 key={mode + '-title'} className="hero-text-enter hero-text-enter-delay-1 font-bold text-5xl sm:text-6xl lg:text-7xl xl:text-8xl tracking-tighter leading-[0.9] mb-8" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
                {h.title}
              </h1>

              <p key={mode + '-sub'} className="hero-text-enter hero-text-enter-delay-2 max-w-2xl text-lg sm:text-xl text-black/50 font-light leading-relaxed mb-14">
                {h.subtitle}
              </p>

              <div key={mode + '-cta'} className="hero-text-enter hero-text-enter-delay-3 flex flex-col sm:flex-row items-start gap-4">
                <button
                  onClick={() => mode === 'org' ? document.getElementById('ecoles')?.scrollIntoView({ behavior: 'smooth' }) : navigate('/citizen/register')}
                  className="group inline-flex items-center gap-4 px-8 py-4 bg-black text-white text-[11px] font-medium tracking-[0.2em] uppercase hover:bg-white hover:text-black border-2 border-black transition-colors duration-100"
                >
                  {h.cta}
                  <ArrowRight size={16} strokeWidth={1.5} className="group-hover:translate-x-1 transition-transform duration-100" />
                </button>
                <button
                  onClick={() => mode === 'org' ? document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }) : document.getElementById('ecoles')?.scrollIntoView({ behavior: 'smooth' })}
                  className="inline-flex items-center gap-4 px-8 py-4 bg-transparent text-black text-[11px] font-medium tracking-[0.2em] uppercase border-2 border-black hover:bg-black hover:text-white transition-colors duration-100"
                >
                  {h.cta2}
                </button>
              </div>

              <p key={mode + '-fn'} className="hero-text-enter hero-text-enter-delay-4 mt-10 font-mono text-[10px] tracking-[0.1em] text-black/30 uppercase max-w-lg">
                {h.footnote}
              </p>
            </div>
          </div>
        </section>

        <div className="h-[4px] bg-black" />

        {/* 2. AUDIENCE */}
        <section className="relative py-24 md:py-32 lg:py-40 px-6 md:px-12 lg:px-20">
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, #000 1px, #000 2px)', backgroundSize: '100% 4px', opacity: 0.012 }} />
          <div className="relative max-w-6xl mx-auto">
            <div className="mb-16 max-w-2xl">
              <span className="font-mono text-[10px] tracking-[0.3em] text-[#21B2AA]/60 uppercase block mb-6">Cibles</span>
              <h2 className="font-bold text-4xl sm:text-5xl tracking-tighter leading-[0.95] mb-6" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
                {mode === 'org' ? <>Pour celles et ceux qui décident…<br /><span className="italic font-normal">et devront répondre de leurs décisions.</span></> : <>Pour toutes et tous,<br /><span className="italic font-normal">quel que soit votre niveau.</span></>}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0">
              {a.map((item, i) => (
                <div key={i} className={`group p-8 transition-colors duration-100 hover:bg-black hover:text-white border-b border-black lg:border-b-0 ${i < 3 ? 'lg:border-r lg:border-black' : ''}`}>
                  <item.icon size={24} strokeWidth={1.5} className="mb-6 text-black group-hover:text-white transition-colors duration-100" />
                  <h3 className="font-bold text-lg tracking-tight mb-3 transition-colors duration-100" style={{ fontFamily: "'Inter Tight', sans-serif" }}>{item.title}</h3>
                  <p className="text-black/50 group-hover:text-white/60 text-sm leading-relaxed transition-colors duration-100">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="h-[4px] bg-black" />

        {/* 3. SCHOOLS */}
        <section id="ecoles" className="relative py-24 md:py-32 lg:py-40 px-6 md:px-12 lg:px-20">
          <div className="max-w-6xl mx-auto">
            <div className="mb-20 max-w-2xl">
              <span className="font-mono text-[10px] tracking-[0.3em] text-[#21B2AA]/60 uppercase block mb-6">{mode === 'org' ? 'Écoles' : 'Parcours'}</span>
              <h2 className="font-bold text-4xl sm:text-5xl tracking-tighter leading-[0.95]" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
                {mode === 'org' ? <>Trois écoles, une même ambition :<br /><span className="italic font-normal">remettre l'humain au centre de l'IA.</span></> : <>Trois parcours pour reprendre<br /><span className="italic font-normal">le contrôle de votre vie numérique.</span></>}
              </h2>
            </div>
            <div className="space-y-0">
              {s.map((item, i) => (
                <div key={i} className={`group border-t-[2px] border-black ${i === s.length - 1 ? 'border-b-[2px]' : ''} py-12 md:py-16 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12`}>
                  <div className="md:col-span-1"><span className="font-mono text-[10px] tracking-[0.3em] text-[#21B2AA]/50">{item.num}.</span></div>
                  <div className="md:col-span-5">
                    <h3 className="font-bold text-2xl sm:text-3xl tracking-tight mb-3" style={{ fontFamily: "'Inter Tight', sans-serif" }}>{item.title}</h3>
                    <p className="text-black/40 italic text-lg font-display">{item.quote}</p>
                  </div>
                  <div className="md:col-span-5">
                    <ul className="space-y-3 text-black/60 text-sm leading-relaxed mb-8">
                      {item.items.map((li, j) => (
                        <li key={j} className="flex gap-3"><span className="w-1.5 h-1.5 bg-[#21B2AA] rounded-full mt-2 shrink-0" />{li}</li>
                      ))}
                    </ul>
                    <button className="text-[11px] font-medium tracking-[0.15em] uppercase border-b-2 border-black pb-1 hover:bg-black hover:text-white hover:px-4 hover:py-2 hover:border-transparent transition-all duration-100">
                      {item.cta}
                    </button>
                  </div>
                  <div className="md:col-span-1" />
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="h-[4px] bg-black" />

        {/* 4. FORMATS */}
        <section className="relative py-24 md:py-32 lg:py-40 px-6 md:px-12 lg:px-20">
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 40px, #00000008 40px, #00000008 42px)', opacity: 0.5 }} />
          <div className="relative max-w-6xl mx-auto">
            <div className="mb-16 max-w-2xl">
              <span className="font-mono text-[10px] tracking-[0.3em] text-[#21B2AA]/60 uppercase block mb-6">Formats</span>
              <h2 className="font-bold text-4xl sm:text-5xl tracking-tighter leading-[0.95]" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
                {mode === 'org' ? <>Une académie,<br /><span className="italic font-normal">trois formats complémentaires.</span></> : <>Des outils concrets,<br /><span className="italic font-normal">accessibles à tous.</span></>}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
              {f.map((item, i) => (
                <div key={i} className={`group p-8 md:p-10 transition-colors duration-100 hover:bg-black hover:text-white ${i < 2 ? 'md:border-r md:border-black' : ''} ${i < 2 ? 'border-b md:border-b-0 border-black' : ''}`}>
                  <item.icon size={24} strokeWidth={1.5} className="mb-6 text-black group-hover:text-white transition-colors duration-100" />
                  <h3 className="font-bold text-xl tracking-tight mb-4 transition-colors duration-100" style={{ fontFamily: "'Inter Tight', sans-serif" }}>{item.title}</h3>
                  <p className="text-black/50 group-hover:text-white/60 text-sm leading-relaxed transition-colors duration-100">{item.text}</p>
                </div>
              ))}
            </div>
            <div className="mt-12 text-center">
              <button
                onClick={() => mode === 'particulier' ? navigate('/citizen/register') : undefined}
                className="px-8 py-4 border-2 border-black text-black text-[11px] font-medium tracking-[0.2em] uppercase hover:bg-black hover:text-white transition-colors duration-100"
              >
                {mode === 'org' ? 'Télécharger le catalogue des programmes' : 'Créer mon compte gratuit'}
              </button>
            </div>
          </div>
        </section>

        <div className="h-[4px] bg-black" />

        {/* 5. LAB IA / ENGAGEMENT */}
        <section className="relative py-24 md:py-32 lg:py-40 px-6 md:px-12 lg:px-20 bg-black text-white overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 1px, #fff 1px, #fff 2px)', backgroundSize: '4px 100%', opacity: 0.02 }} />
          <div className="relative max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
              <div className="lg:col-span-7">
                <span className="font-mono text-[10px] tracking-[0.3em] text-[#21B2AA]/70 uppercase block mb-6">{mode === 'org' ? 'Lab IA' : 'Notre engagement'}</span>
                <h2 className="font-bold text-4xl sm:text-5xl tracking-tighter leading-[0.95] mb-10" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
                  {mode === 'org' ? <>Une académie adossée à un Lab IA,<br /><span className="italic font-normal">pas à des slides théoriques.</span></> : <>100% gratuit, 100% indépendant,<br /><span className="italic font-normal">100% au service du citoyen.</span></>}
                </h2>
                <ul className="space-y-6 text-white/60 text-base leading-relaxed">
                  {(mode === 'org' ? [
                    'Cas d\'usage issus des missions du Lab IA (anonymisés)',
                    'Veille continue sur AI Act, RGPD, cybersécurité, jurisprudence',
                    'Expérimentations encadrées : simulations de décisions assistées, tests d\'interfaces, exercices de « red teaming » cognitif',
                  ] : [
                    'Aucune donnée personnelle revendue — jamais',
                    'Contenus validés par des juristes spécialisés en droit du numérique',
                    'Outils mis à jour en continu avec l\'évolution de la réglementation',
                  ]).map((item, i) => (
                    <li key={i} className="flex gap-4">
                      <span className="w-6 h-[2px] bg-white/30 mt-3 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="lg:col-span-5 flex items-center">
                <div className="border-2 border-white/20 p-8 lg:p-10">
                  <p className="text-white/50 text-base leading-relaxed italic font-display">
                    {mode === 'org'
                      ? '« Vous avez déjà un projet IA en cours ? L\'Académie peut s\'appuyer dessus comme fil rouge pédagogique. »'
                      : '« Dataring est une initiative de l\'association adossée au cabinet Altij, spécialisé en droit du numérique depuis plus de 20 ans. »'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="h-[4px] bg-black" />

        {/* 6. RESULTS */}
        <section className="relative py-24 md:py-32 lg:py-40 px-6 md:px-12 lg:px-20">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
              <div className="lg:col-span-5">
                <span className="font-mono text-[10px] tracking-[0.3em] text-[#21B2AA]/60 uppercase block mb-6">Résultats</span>
                <h2 className="font-bold text-4xl sm:text-5xl tracking-tighter leading-[0.95]" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
                  {mode === 'org' ? <>Ce que vos équipes sauront faire<br /><span className="italic font-normal">après l'Académie.</span></> : <>Ce que vous saurez faire<br /><span className="italic font-normal">après les parcours.</span></>}
                </h2>
              </div>
              <div className="lg:col-span-7">
                <ul className="space-y-0">
                  {r.map((item, i) => (
                    <li key={i} className="flex gap-4 py-5 border-b border-black/10 last:border-b-0">
                      <span className="font-mono text-[10px] tracking-[0.3em] text-[#21B2AA]/40 mt-1 shrink-0">{String(i + 1).padStart(2, '0')}.</span>
                      <span className="text-black/70 text-base leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <div className="h-[4px] bg-black" />

        {/* 7. CTA FINAL */}
        <section id="contact" className="relative py-32 md:py-40 lg:py-48 px-6 bg-black text-white overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at top center, #ffffff, transparent 70%)', opacity: 0.04 }} />
          <div className="relative z-10 max-w-3xl mx-auto text-center">
            <div className="flex justify-center mb-12"><div className="w-16 h-[2px] bg-[#21B2AA]/50" /></div>
            <h2 className="font-bold text-4xl sm:text-5xl lg:text-6xl tracking-tighter leading-[0.95] mb-8" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
              {mode === 'org' ? <>Prêt à former des décideurs augmentés…<br /><span className="italic font-normal">mais pas dépossédés ?</span></> : <>Prêt à reprendre le contrôle<br /><span className="italic font-normal">de votre vie numérique ?</span></>}
            </h2>
            <p className="text-lg sm:text-xl text-white/40 font-light leading-relaxed mb-14 max-w-2xl mx-auto">
              {mode === 'org'
                ? 'L\'IA ne va pas tuer l\'économie. Elle peut, en revanche, fragiliser nos organisations si elle érode le jugement, la compétence et la responsabilité. L\'Académie Dataring est là pour éviter ce scénario.'
                : 'Vos données personnelles sont précieuses. Vos droits numériques sont réels. Il suffit de les connaître pour les exercer. Rejoignez des milliers de citoyens qui reprennent le contrôle.'}
            </p>
            <button
              onClick={() => mode === 'particulier' ? navigate('/citizen/register') : undefined}
              className="px-10 py-4 border-2 border-white text-white text-[11px] font-medium tracking-[0.2em] uppercase hover:bg-white hover:text-black transition-colors duration-100"
            >
              {mode === 'org' ? 'Être recontacté par l\'équipe DataRing' : 'Créer mon compte — c\'est gratuit'}
            </button>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t-[4px] border-black bg-white py-10 px-6 md:px-12 lg:px-20">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <span className="font-mono text-[10px] tracking-[0.2em] text-black/40 uppercase">Dataring © {new Date().getFullYear()}</span>
            <div className="flex items-center gap-10 font-mono text-[10px] tracking-[0.15em] text-black/40 uppercase">
              <span className="hover:text-black border-b border-transparent hover:border-black transition-colors duration-100 cursor-pointer">Mentions Légales</span>
              <span className="hover:text-black border-b border-transparent hover:border-black transition-colors duration-100 cursor-pointer">Contact</span>
            </div>
            <span className="font-mono text-[10px] tracking-[0.2em] text-[#21B2AA]/60 uppercase">Académie & Lab IA</span>
          </div>
        </footer>

      </main>
    </div>
  );
}

export default Landing;
