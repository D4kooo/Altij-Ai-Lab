import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Shield } from 'lucide-react';

export function Landing() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);

    // Smooth mouse follow for the parralax poetic glow
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 40,
        y: (e.clientY / window.innerHeight - 0.5) * 40,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#030303] text-[#FAFAFA] font-sans selection:bg-[#21B2AA] selection:text-white overflow-x-hidden">

      {/* Inline styles for custom poetic animations */}
      <style>{`
        @keyframes ethereal-pulse {
          0%, 100% { opacity: 0.3; transform: scale(1) translate(0, 0); }
          50% { opacity: 0.5; transform: scale(1.05) translate(1%, 2%); }
        }
        @keyframes float-up {
          0% { opacity: 0; transform: translateY(40px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes levitate {
          0%, 100% { transform: translateY(0) rotate(-1deg); }
          50% { transform: translateY(-25px) rotate(2deg); }
        }
        .animate-ethereal {
          animation: ethereal-pulse 18s ease-in-out infinite alternate;
        }
        .animate-float-up {
          animation: float-up 1.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-levitate {
          animation: levitate 7s ease-in-out infinite;
        }
        .delay-100 { animation-delay: 150ms; }
        .delay-200 { animation-delay: 300ms; }
      `}</style>

      {/* BACKGROUND IMAGE & POETIC LIGHTING EFFECT */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* User-provided background image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-90 mix-blend-screen"
          style={{ backgroundImage: 'url("/assets/dataring-hero.png")' }}
        ></div>

        {/* Subtle vignette/gradient to ensure text remains readable and blends with black background */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#030303] via-[#030303]/80 to-transparent w-full"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-transparent to-[#030303]/40"></div>

        {/* Ultra subtle grain */}
        <div className="absolute inset-0 bg-noise opacity-[0.03] mix-blend-overlay"></div>

        {/* Dynamic, soft glowing orb following mouse slightly */}
        <div
          className="absolute top-1/2 left-1/2 w-[1200px] h-[1200px] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(circle,rgba(33,178,170,0.1)_0%,rgba(0,0,0,0)_40%)] rounded-full blur-[120px] animate-ethereal transition-transform duration-[1500ms] ease-out mix-blend-screen"
          style={{ transform: `translate(calc(-50% + ${mousePos.x}px), calc(-50% + ${mousePos.y}px))` }}
        ></div>
      </div>

      {/* MINIMALIST HEADER */}
      <header className={`fixed top-0 w-full z-50 px-6 sm:px-12 py-8 transition-all duration-700 flex items-center justify-between ${scrolled ? 'bg-[#030303]/70 backdrop-blur-2xl border-b border-white/5 py-6' : 'bg-transparent'}`}>
        <div className="flex items-center gap-4 cursor-pointer group" onClick={() => navigate('/')}>
          <div className="w-2.5 h-2.5 rounded-full bg-white/90 group-hover:bg-[#21B2AA] transition-colors duration-700 shadow-[0_0_15px_rgba(255,255,255,0.3)] group-hover:shadow-[0_0_20px_rgba(33,178,170,0.6)]"></div>
          <span className="font-medium tracking-[0.35em] text-[10px] sm:text-[11px] uppercase text-white/80 group-hover:text-white transition-colors duration-700">
            Data Ring
          </span>
        </div>

        <div className="flex items-center gap-8 text-[10px] sm:text-[11px] font-medium tracking-[0.15em] uppercase">
          <button
            onClick={() => navigate('/citizen/login')}
            className="hidden sm:block text-white/40 hover:text-white transition-colors duration-500"
          >
            Connexion
          </button>
          <button
            onClick={() => navigate('/citizen/register')}
            className="relative overflow-hidden px-7 py-3 rounded-full border border-white/10 hover:border-[#21B2AA]/40 group transition-all duration-700 bg-white/5 backdrop-blur-sm"
          >
            <div className="absolute inset-0 bg-white/5 group-hover:bg-[#21B2AA]/10 transition-colors duration-700"></div>
            <span className="relative z-10 text-white/80 group-hover:text-white transition-colors duration-700">Adhérer</span>
          </button>
        </div>
      </header>

      {/* HERO SECTION - PURE & ELEGANT */}
      <main className="relative z-10">
        <section className="min-h-screen flex items-center px-6 sm:px-12 md:px-24 xl:px-32 relative">

          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left/Text Content */}
            <div className="lg:col-span-7 xl:col-span-7 max-w-5xl opacity-0 animate-float-up pt-20">
              <div className="inline-flex items-center gap-4 mb-10">
                <span className="w-10 h-[1px] bg-[#21B2AA]/80"></span>
                <span className="text-[#21B2AA] text-[10px] sm:text-xs font-medium tracking-[0.25em] uppercase">
                  Association reconnue d'intérêt général
                </span>
              </div>

              <h1 className="text-5xl sm:text-7xl lg:text-[6.5rem] font-light tracking-[-0.03em] leading-[1.05] mb-10 text-white">
                Souveraineté et <br />
                <span className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-white via-white/90 to-[#21B2AA]/80">
                  droits humains.
                </span>
              </h1>

              <p className="max-w-2xl text-lg sm:text-2xl text-white/40 font-light leading-relaxed mb-16 opacity-0 animate-float-up delay-100">
                Data Ring érige les contre-pouvoirs nécessaires face à l'empreinte numérique. Nous transformons la conformité en une véritable souveraineté citoyenne.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-6 opacity-0 animate-float-up delay-200">
                <button
                  onClick={() => navigate('/citizen/register')}
                  className="w-full sm:w-auto px-10 py-5 bg-white text-black text-[11px] font-bold tracking-[0.2em] uppercase rounded-full hover:bg-[#21B2AA] hover:text-white transition-all duration-700 shadow-[0_0_30px_rgba(255,255,255,0.05)] hover:shadow-[0_0_40px_rgba(33,178,170,0.25)] flex items-center justify-center gap-4 group"
                >
                  Rejoignez le mouvement <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>



          </div>
        </section>

        {/* VALEURS - LA PURETÉ */}
        <section className="py-40 px-6 sm:px-12 md:px-24 xl:px-32 border-t border-white/5 bg-gradient-to-b from-transparent to-[#020202]">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-20 md:gap-12">

              <div className="group">
                <div className="text-[#21B2AA] text-[10px] font-medium tracking-[0.3em] font-mono mb-8 opacity-70">01.</div>
                <h3 className="text-3xl text-white font-light tracking-tight mb-6 group-hover:text-[#21B2AA] transition-colors duration-700">
                  Indépendance
                </h3>
                <p className="text-white/40 text-lg font-light leading-relaxed">
                  Reconnue d'intérêt général, notre structure opère sans influence, orientée vers l'autodétermination informationnelle des individus.
                </p>
              </div>

              <div className="group">
                <div className="text-[#21B2AA] text-[10px] font-medium tracking-[0.3em] font-mono mb-8 opacity-70">02.</div>
                <h3 className="text-3xl text-white font-light tracking-tight mb-6 group-hover:text-[#21B2AA] transition-colors duration-700">
                  Souveraineté
                </h3>
                <p className="text-white/40 text-lg font-light leading-relaxed">
                  Face aux géants technologiques, nous imposons des standards de protection locaux, reprenant le contrôle de nos espaces numériques.
                </p>
              </div>

              <div className="group">
                <div className="text-[#21B2AA] text-[10px] font-medium tracking-[0.3em] font-mono mb-8 opacity-70">03.</div>
                <h3 className="text-3xl text-white font-light tracking-tight mb-6 group-hover:text-[#21B2AA] transition-colors duration-700">
                  Résistance
                </h3>
                <p className="text-white/40 text-lg font-light leading-relaxed">
                  Nous documentons, alertons et agissons concrètement. Un refus actif de la servilité volontaire face à l'exploitation des données.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="py-48 px-6 relative overflow-hidden flex items-center justify-center text-center">
          <div className="absolute inset-0 bg-[#020202]"></div>
          <div className="absolute w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(33,178,170,0.08)_0%,rgba(0,0,0,0)_70%)] rounded-full blur-[100px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

          <div className="relative z-10 max-w-3xl flex flex-col items-center">
            <Shield className="w-14 h-14 text-[#21B2AA] mb-10 opacity-70" strokeWidth={1.5} />
            <h2 className="text-5xl sm:text-7xl font-light tracking-tight text-white mb-8">
              L'impact associatif.
            </h2>
            <p className="text-xl sm:text-2xl text-white/40 font-light mb-14 max-w-xl">
              L'heure n'est plus à l'observation, mais à la structuration d'un monde numériquement respectueux.
            </p>
            <button
              onClick={() => navigate('/citizen/register')}
              className="px-12 py-5 border border-white/20 text-white text-[11px] font-medium tracking-[0.2em] uppercase rounded-full hover:bg-white hover:text-black hover:border-white transition-all duration-700"
            >
              Faire un don ou adhérer
            </button>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-white/5 bg-[#020202] py-10 px-6 sm:px-12 md:px-24 xl:px-32">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
            <span className="text-[10px] font-medium tracking-[0.2em] text-white/30 uppercase">
              DATA RING © {new Date().getFullYear()}
            </span>
            <div className="flex items-center gap-10 text-[10px] font-medium tracking-[0.15em] text-white/30 uppercase">
              <span className="hover:text-white transition-colors cursor-pointer">Mentions Légales</span>
              <span className="hover:text-white transition-colors cursor-pointer">Contact</span>
            </div>
            <span className="text-[10px] font-medium tracking-[0.25em] text-[#21B2AA]/80 uppercase flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#21B2AA] animate-pulse"></span>
              Intérêt Général
            </span>
          </div>
        </footer>

      </main>
    </div >
  );
}

export default Landing;
