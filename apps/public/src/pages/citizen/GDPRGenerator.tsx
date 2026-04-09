import { useState, useEffect, useRef } from 'react';
import { ArrowRight, Copy, Check } from 'lucide-react';
import { generateLetter as generateLetterUtil, type RightType } from './GDPRGenerator.utils';

const rights: { id: RightType; title: string; description: string; article: string }[] = [
  {
    id: 'access',
    title: "Droit d'accès",
    description: "Obtenir une copie de toutes les données qu'une entreprise détient sur vous.",
    article: 'Art. 15',
  },
  {
    id: 'rectification',
    title: 'Droit de rectification',
    description: 'Corriger des informations inexactes ou incomplètes vous concernant.',
    article: 'Art. 16',
  },
  {
    id: 'erasure',
    title: "Droit à l'effacement",
    description: "Demander la suppression de vos données personnelles.",
    article: 'Art. 17',
  },
  {
    id: 'portability',
    title: 'Droit à la portabilité',
    description: 'Récupérer vos données dans un format structuré et réutilisable.',
    article: 'Art. 20',
  },
];

const popularCompanies = [
  { name: 'Google', email: 'support-fr@google.com' },
  { name: 'Facebook/Meta', email: 'dataprivacy@support.facebook.com' },
  { name: 'Amazon', email: 'privacy@amazon.fr' },
  { name: 'Apple', email: 'dpo@apple.com' },
  { name: 'Microsoft', email: 'dpo@microsoft.com' },
  { name: 'LinkedIn', email: 'dpo@linkedin.com' },
];

function GDPRAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Respect reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * 2;
      canvas.height = rect.height * 2;
      ctx.scale(2, 2);
    };
    resize();
    window.addEventListener('resize', resize);

    const particles: { x: number; y: number; vx: number; vy: number; life: number; maxLife: number }[] = [];

    const draw = () => {
      if (document.hidden) {
        animId = requestAnimationFrame(draw);
        return;
      }
      const w = canvas.width / 2;
      const h = canvas.height / 2;
      ctx.clearRect(0, 0, w, h);
      t += 0.008;

      // Shield shape (centered in canvas)
      const cx = w * 0.5;
      const cy = h * 0.55;
      const scale = Math.min(h * 0.35, 55);

      ctx.save();
      ctx.translate(cx, cy);

      // Pulsing shield outlines
      for (let i = 0; i < 3; i++) {
        const pulse = Math.sin(t * 2 + i * 0.8) * 0.05 + 1;
        const s = scale * pulse * (1 + i * 0.2);
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.bezierCurveTo(s * 0.8, -s * 0.8, s, -s * 0.2, s, s * 0.1);
        ctx.bezierCurveTo(s * 0.8, s * 0.7, 0, s * 1.1, 0, s * 1.1);
        ctx.bezierCurveTo(0, s * 1.1, -s * 0.8, s * 0.7, -s, s * 0.1);
        ctx.bezierCurveTo(-s, -s * 0.2, -s * 0.8, -s * 0.8, 0, -s);
        ctx.strokeStyle = `rgba(0,0,0,${0.12 - i * 0.03})`;
        ctx.lineWidth = 1.5 - i * 0.3;
        ctx.stroke();
      }

      // Checkmark
      const checkPhase = (Math.sin(t * 3) + 1) / 2;
      ctx.beginPath();
      ctx.moveTo(-scale * 0.3, scale * 0.05);
      ctx.lineTo(-scale * 0.05, scale * 0.3);
      ctx.lineTo(scale * 0.35, -scale * 0.2);
      ctx.strokeStyle = `rgba(33,178,170,${0.15 + checkPhase * 0.2})`;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.restore();

      // Data particles flowing across
      if (Math.random() < 0.2) {
        particles.push({
          x: -10,
          y: Math.random() * h,
          vx: 0.8 + Math.random() * 2,
          vy: (Math.random() - 0.5) * 0.4,
          life: 0,
          maxLife: 60 + Math.random() * 50,
        });
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        const progress = p.life / p.maxLife;
        const alpha = Math.sin(progress * Math.PI) * 0.15;
        const len = 12 + Math.random() * 25;

        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + len, p.y);
        ctx.strokeStyle = `rgba(0,0,0,${alpha})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();

        if (p.life > p.maxLife || p.x > w + 20) {
          particles.splice(i, 1);
        }
      }

      // Grid dots
      const spacing = 25;
      for (let x = spacing / 2; x < w; x += spacing) {
        for (let y = spacing / 2; y < h; y += spacing) {
          const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
          const wave = Math.sin(dist * 0.04 - t * 3) * 0.5 + 0.5;
          ctx.beginPath();
          ctx.arc(x, y, 0.6 + wave * 0.8, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0,0,0,${0.04 + wave * 0.06})`;
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    const handleVisibility = () => {
      if (!document.hidden) {
        animId = requestAnimationFrame(draw);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ left: '40%', width: '60%', top: '20px' }}
    />
  );
}

export function GDPRGenerator() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedRight, setSelectedRight] = useState<RightType | null>(null);
  const [formData, setFormData] = useState({
    companyName: '',
    companyEmail: '',
    userName: '',
    userEmail: '',
    additionalInfo: '',
  });
  const [copied, setCopied] = useState(false);

  const generateLetter = (): string => generateLetterUtil(selectedRight, formData);

  const handleCopy = () => {
    navigator.clipboard.writeText(generateLetter());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCompanySelect = (company: { name: string; email: string }) => {
    setFormData((prev) => ({
      ...prev,
      companyName: company.name,
      companyEmail: company.email,
    }));
  };

  return (
    <div className="space-y-10">
      {/* Header with animation */}
      <div className="relative min-h-[180px] sm:min-h-[200px]">
        {/* Animation canvas — fills right side */}
        <GDPRAnimation />

        <div className="relative z-10 max-w-md">
          <span className="font-mono text-[10px] tracking-[0.3em] text-brand-turquoise/60 uppercase block mb-4">RGPD</span>
          <h1 className="font-heading font-bold text-3xl sm:text-4xl tracking-tighter leading-[0.95]">
            Exercez vos droits<br />
            <span className="italic font-normal">sur vos données.</span>
          </h1>
          <p className="mt-4 text-black/50 text-sm leading-relaxed">
            Générez une lettre personnalisée pour demander l'accès, la rectification, la suppression ou la portabilité de vos données.
          </p>
        </div>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-0">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div className="flex items-center gap-3">
              <span className={`font-mono text-[11px] tracking-[0.1em] w-7 h-7 flex items-center justify-center border-2 ${
                step >= s ? 'border-black text-black' : 'border-black/15 text-black/25'
              }`}>
                {s}
              </span>
              <span className={`font-mono text-[10px] tracking-[0.1em] uppercase hidden sm:block ${
                step >= s ? 'text-black' : 'text-black/25'
              }`}>
                {s === 1 && 'Droit'}
                {s === 2 && 'Infos'}
                {s === 3 && 'Lettre'}
              </span>
            </div>
            {s < 3 && <div className={`w-8 sm:w-12 h-[2px] mx-3 ${step > s ? 'bg-black' : 'bg-black/10'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Select Right */}
      {step === 1 && (
        <div className="space-y-6">
          <span className="font-mono text-[10px] tracking-[0.3em] text-black/50 uppercase block">
            Quel droit souhaitez-vous exercer ?
          </span>

          <div className="border-t-[2px] border-black">
            {rights.map((right, i) => (
              <button
                key={right.id}
                onClick={() => {
                  setSelectedRight(right.id);
                  setStep(2);
                }}
                className="w-full text-left flex items-center gap-4 sm:gap-6 py-6 border-b border-black/10 hover:border-black transition-colors duration-100 group"
              >
                <span className="font-mono text-[10px] tracking-[0.3em] text-brand-turquoise/50 w-8 shrink-0">
                  {String(i + 1).padStart(2, '0')}.
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading font-bold text-lg tracking-tight">
                    {right.title}
                  </h3>
                  <p className="text-black/50 text-sm leading-relaxed mt-1">{right.description}</p>
                </div>
                <span className="font-mono text-[9px] tracking-[0.15em] text-black/25 uppercase shrink-0 hidden sm:block">
                  {right.article}
                </span>
                <ArrowRight size={16} strokeWidth={1.5} className="text-black/50 group-hover:translate-x-1 transition-transform duration-100 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Form */}
      {step === 2 && (
        <div className="space-y-8">
          {/* Popular companies */}
          <div>
            <span className="font-mono text-[10px] tracking-[0.3em] text-black/50 uppercase block mb-4">
              Entreprises courantes
            </span>
            <div className="flex flex-wrap gap-2">
              {popularCompanies.map((company) => (
                <button
                  key={company.name}
                  onClick={() => handleCompanySelect(company)}
                  className={`px-4 py-2 text-[11px] font-medium tracking-[0.1em] uppercase border-2 transition-colors duration-100 ${
                    formData.companyName === company.name
                      ? 'border-black bg-black text-white'
                      : 'border-black/15 text-black/50 hover:border-black hover:text-black'
                  }`}
                >
                  {company.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-8">
            {/* Company Info */}
            <div className="space-y-4">
              <span className="font-mono text-[10px] tracking-[0.15em] text-black/50 uppercase block">
                Entreprise destinataire
              </span>
              <div className="space-y-3">
                <div>
                  <label htmlFor="gdpr-company-name" className="block font-mono text-[10px] tracking-[0.1em] text-black/60 uppercase mb-2">Nom</label>
                  <input
                    id="gdpr-company-name"
                    value={formData.companyName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, companyName: e.target.value }))}
                    placeholder="Ex: Google, Amazon..."
                    className="w-full px-4 py-3 border-2 border-black/15 text-sm placeholder:text-black/25 focus:border-black focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="gdpr-company-email" className="block font-mono text-[10px] tracking-[0.1em] text-black/60 uppercase mb-2">Email DPO</label>
                  <input
                    id="gdpr-company-email"
                    type="email"
                    value={formData.companyEmail}
                    onChange={(e) => setFormData((prev) => ({ ...prev, companyEmail: e.target.value }))}
                    placeholder="dpo@entreprise.com"
                    className="w-full px-4 py-3 border-2 border-black/15 text-sm placeholder:text-black/25 focus:border-black focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* User Info */}
            <div className="space-y-4">
              <span className="font-mono text-[10px] tracking-[0.15em] text-black/50 uppercase block">
                Vos informations
              </span>
              <div className="space-y-3">
                <div>
                  <label htmlFor="gdpr-user-name" className="block font-mono text-[10px] tracking-[0.1em] text-black/60 uppercase mb-2">Nom complet</label>
                  <input
                    id="gdpr-user-name"
                    value={formData.userName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, userName: e.target.value }))}
                    placeholder="Jean Dupont"
                    className="w-full px-4 py-3 border-2 border-black/15 text-sm placeholder:text-black/25 focus:border-black focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="gdpr-user-email" className="block font-mono text-[10px] tracking-[0.1em] text-black/60 uppercase mb-2">Email</label>
                  <input
                    id="gdpr-user-email"
                    type="email"
                    value={formData.userEmail}
                    onChange={(e) => setFormData((prev) => ({ ...prev, userEmail: e.target.value }))}
                    placeholder="jean.dupont@email.com"
                    className="w-full px-4 py-3 border-2 border-black/15 text-sm placeholder:text-black/25 focus:border-black focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          {(selectedRight === 'rectification' || selectedRight === 'erasure' || selectedRight === 'portability') && (
            <div>
              <label className="block font-mono text-[10px] tracking-[0.1em] text-black/60 uppercase mb-2">
                Informations complémentaires (optionnel)
              </label>
              <textarea
                value={formData.additionalInfo}
                onChange={(e) => setFormData((prev) => ({ ...prev, additionalInfo: e.target.value }))}
                placeholder={
                  selectedRight === 'rectification'
                    ? 'Précisez les informations à corriger...'
                    : 'Précisez votre demande si nécessaire...'
                }
                rows={4}
                className="w-full px-4 py-3 border-2 border-black/15 text-sm placeholder:text-black/25 focus:border-black focus:outline-none transition-colors resize-none"
              />
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-3 border-2 border-black text-[11px] font-medium tracking-[0.15em] uppercase hover:bg-black hover:text-white transition-colors duration-100"
            >
              Retour
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!formData.companyName || !formData.companyEmail || !formData.userName || !formData.userEmail}
              className="px-6 py-3 bg-black text-white text-[11px] font-medium tracking-[0.15em] uppercase border-2 border-black hover:bg-white hover:text-black transition-colors duration-100 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-black disabled:hover:text-white"
            >
              Générer la lettre
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Generated Letter */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] tracking-[0.3em] text-black/50 uppercase">
              Votre lettre
            </span>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-2 px-4 py-2 border-2 border-black text-[11px] font-medium tracking-[0.15em] uppercase hover:bg-black hover:text-white transition-colors duration-100"
            >
              {copied ? (
                <><Check size={14} strokeWidth={1.5} /> Copié</>
              ) : (
                <><Copy size={14} strokeWidth={1.5} /> Copier</>
              )}
            </button>
          </div>

          <div className="border-2 border-black p-6 sm:p-8">
            <pre className="whitespace-pre-wrap text-sm text-black/70 font-mono leading-relaxed">
              {generateLetter()}
            </pre>
          </div>

          <div className="border-l-[3px] border-brand-turquoise/30 pl-6 py-2">
            <p className="font-mono text-[10px] tracking-[0.15em] text-brand-turquoise/60 uppercase mb-2">Prochaine étape</p>
            <p className="text-black/50 text-sm leading-relaxed">
              Envoyez cette lettre à <strong className="text-black">{formData.companyEmail}</strong> depuis votre boîte email ({formData.userEmail}). L'entreprise a légalement un mois pour vous répondre.
            </p>
          </div>

          <button
            onClick={() => {
              setStep(1);
              setSelectedRight(null);
              setFormData({ companyName: '', companyEmail: '', userName: '', userEmail: '', additionalInfo: '' });
            }}
            className="px-6 py-3 border-2 border-black text-[11px] font-medium tracking-[0.15em] uppercase hover:bg-black hover:text-white transition-colors duration-100"
          >
            Nouvelle demande
          </button>
        </div>
      )}
    </div>
  );
}
