import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { breachCheckApi, ApiError } from '@/lib/api';
import type { BreachResult } from '@/lib/api';

const securityTips = [
  { title: 'Changez vos mots de passe', text: 'Utilisez un mot de passe unique pour chaque service compromis.' },
  { title: 'Activez la 2FA', text: "L'authentification à deux facteurs protège même si votre mot de passe fuite." },
  { title: 'Surveillez vos comptes', text: 'Vérifiez régulièrement vos relevés bancaires pour détecter des fraudes.' },
  { title: 'Méfiez-vous du phishing', text: 'Les données volées sont souvent utilisées pour des attaques ciblées.' },
];

const severityLabels: Record<string, { label: string; style: string }> = {
  critical: { label: 'Critique', style: 'border-black bg-black text-white' },
  high: { label: 'Élevée', style: 'border-black/60 text-black' },
  medium: { label: 'Moyenne', style: 'border-black/30 text-black/60' },
  low: { label: 'Faible', style: 'border-black/15 text-black/60' },
};

function BreachAnimation() {
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

    type Node = { baseX: number; baseY: number; x: number; y: number; r: number; broken: boolean; breakTime: number };
    const nodes: Node[] = [];

    const initNodes = () => {
      nodes.length = 0;
      const w = canvas.width / 2;
      const h = canvas.height / 2;
      for (let i = 0; i < 30; i++) {
        const x = 20 + Math.random() * (w - 40);
        const y = 10 + Math.random() * (h - 20);
        nodes.push({
          baseX: x, baseY: y, x, y,
          r: 2.5 + Math.random() * 3.5,
          broken: false,
          breakTime: 3 + Math.random() * 7,
        });
      }
    };
    initNodes();

    const sparks: { x: number; y: number; vx: number; vy: number; life: number }[] = [];

    const draw = () => {
      if (document.hidden) {
        animId = requestAnimationFrame(draw);
        return;
      }
      const w = canvas.width / 2;
      const h = canvas.height / 2;
      ctx.clearRect(0, 0, w, h);
      t += 0.01;

      nodes.forEach((n) => {
        n.x = n.baseX + Math.sin(t * 1.5 + n.baseX * 0.08) * 4;
        n.y = n.baseY + Math.cos(t * 1.2 + n.baseY * 0.08) * 3;
        const cycle = (t % n.breakTime) / n.breakTime;
        const wasBroken = n.broken;
        n.broken = cycle > 0.65 && cycle < 0.85;

        if (n.broken && !wasBroken) {
          for (let s = 0; s < 4; s++) {
            sparks.push({
              x: n.x, y: n.y,
              vx: (Math.random() - 0.5) * 3,
              vy: (Math.random() - 0.5) * 3,
              life: 30,
            });
          }
        }
      });

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dist = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
          if (dist > 100) continue;

          const broken = a.broken || b.broken;
          const alpha = (1 - dist / 100) * 0.12;

          if (broken) {
            ctx.setLineDash([3, 5]);
            ctx.strokeStyle = `rgba(0,0,0,${alpha * 0.4})`;
          } else {
            ctx.setLineDash([]);
            ctx.strokeStyle = `rgba(0,0,0,${alpha})`;
          }

          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
      ctx.setLineDash([]);

      nodes.forEach((n) => {
        if (n.broken) {
          const ringR = n.r + 5 + Math.sin(t * 8) * 2;
          ctx.beginPath();
          ctx.arc(n.x, n.y, ringR, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(33,178,170,0.2)';
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(33,178,170,0.08)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(33,178,170,0.25)';
          ctx.lineWidth = 1;
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(0,0,0,0.06)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(0,0,0,0.12)';
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      });

      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.vx *= 0.95;
        s.vy *= 0.95;
        s.life--;

        const alpha = (s.life / 30) * 0.3;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(33,178,170,${alpha})`;
        ctx.fill();

        if (s.life <= 0) sparks.splice(i, 1);
      }

      const tx = w - 40;
      const ty = h - 30;
      const ts = 16 + Math.sin(t * 3) * 3;
      const tAlpha = 0.08 + Math.sin(t * 3) * 0.04;

      ctx.beginPath();
      ctx.moveTo(tx, ty - ts);
      ctx.lineTo(tx + ts, ty + ts * 0.6);
      ctx.lineTo(tx - ts, ty + ts * 0.6);
      ctx.closePath();
      ctx.strokeStyle = `rgba(0,0,0,${tAlpha})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(tx, ty - ts * 0.25);
      ctx.lineTo(tx, ty + ts * 0.1);
      ctx.strokeStyle = `rgba(0,0,0,${tAlpha})`;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(tx, ty + ts * 0.3, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,0,0,${tAlpha})`;
      ctx.fill();

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
      style={{ left: '35%', width: '65%' }}
    />
  );
}

export function DataBreachAlerts() {
  const { user } = useAuthStore();
  const [email, setEmail] = useState(user?.email || '');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [breaches, setBreaches] = useState<BreachResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!email.trim()) return;
    setIsSearching(true);
    setHasSearched(false);
    setError(null);
    setInfoMessage(null);

    try {
      const result = await breachCheckApi.check(email.trim());
      setBreaches(result.breaches);
      setHasSearched(true);
      if (result.message) {
        setInfoMessage(result.message);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setError('Limite de vérifications atteinte (5 par heure). Réessayez plus tard.');
      } else if (err instanceof ApiError && err.status === 401) {
        setError('Vous devez être connecté pour utiliser cette fonctionnalité.');
      } else {
        setError('Une erreur est survenue. Veuillez réessayer.');
      }
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* Header with animation */}
      <div className="relative min-h-[180px] sm:min-h-[200px]">
        <BreachAnimation />

        <div className="relative z-10 max-w-md">
          <span className="font-mono text-[10px] tracking-[0.3em] text-brand-turquoise/60 uppercase block mb-4">Alertes</span>
          <h1 className="font-heading font-bold text-3xl sm:text-4xl tracking-tighter leading-[0.95]">
            Vos données<br />
            <span className="italic font-normal">ont-elles fuité ?</span>
          </h1>
          <p className="mt-4 text-black/50 text-sm leading-relaxed">
            Vérifiez si votre adresse email apparaît dans des fuites de données connues.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="border-2 border-black p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-label="Rechercher"
            placeholder="Entrez votre adresse email"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 px-4 py-3 border-2 border-black/15 text-sm placeholder:text-black/25 focus:border-black focus:outline-none transition-colors"
          />
          <button
            onClick={handleSearch}
            disabled={!email.trim() || isSearching}
            className="px-6 py-3 bg-black text-white text-[11px] font-medium tracking-[0.15em] uppercase border-2 border-black hover:bg-white hover:text-black transition-colors duration-100 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSearching ? (
              <><Loader2 size={14} className="animate-spin" /> Vérification...</>
            ) : (
              <><Search size={14} strokeWidth={1.5} /> Vérifier</>
            )}
          </button>
        </div>
        <p className="font-mono text-[9px] tracking-[0.1em] text-black/25 uppercase mt-3">
          Votre email n'est pas stocké ni partagé. La vérification est anonyme.
        </p>
        {isSearching && (
          <p className="font-mono text-[9px] tracking-[0.1em] text-black/60 uppercase mt-2">
            La vérification peut prendre quelques secondes...
          </p>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="border-2 border-black p-6 flex items-start gap-4">
          <AlertTriangle size={20} strokeWidth={1.5} className="shrink-0 mt-0.5" />
          <p className="text-sm text-black/70">{error}</p>
        </div>
      )}

      {/* Info message (e.g. API unavailable fallback) */}
      {infoMessage && hasSearched && (
        <div className="border border-black/15 p-4">
          <p className="font-mono text-[10px] tracking-[0.1em] text-black/60 uppercase">{infoMessage}</p>
        </div>
      )}

      {/* Results */}
      {hasSearched && !error && (
        <div className="space-y-8">
          {breaches.length === 0 ? (
            <div className="border-2 border-black p-8 text-center">
              <ShieldCheck size={32} strokeWidth={1.5} className="mx-auto mb-4 text-brand-turquoise" />
              <p className="font-heading font-bold text-xl tracking-tight mb-2">
                Aucune fuite détectée
              </p>
              <p className="text-black/50 text-sm max-w-md mx-auto leading-relaxed">
                Aucune fuite de données connue n'a été trouvée pour cette adresse email. Restez vigilant et continuez à utiliser des mots de passe uniques.
              </p>
            </div>
          ) : (
            <>
              {/* Alert banner */}
              <div className="border-2 border-black p-6 flex items-start gap-4">
                <AlertTriangle size={20} strokeWidth={1.5} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-heading font-bold text-lg tracking-tight">
                    {breaches.length} fuite{breaches.length > 1 ? 's' : ''} détectée{breaches.length > 1 ? 's' : ''}
                  </p>
                  <p className="text-black/50 text-sm leading-relaxed mt-1">
                    Nous vous recommandons de changer vos mots de passe et d'activer l'authentification à deux facteurs.
                  </p>
                </div>
              </div>

              {/* Breach List */}
              <div>
                <span className="font-mono text-[10px] tracking-[0.3em] text-black/50 uppercase block mb-6">
                  Détail des fuites
                </span>
                <div className="border-t-[2px] border-black">
                  {breaches.map((breach, idx) => {
                    const severity = severityLabels[breach.severity] || severityLabels.low;
                    return (
                      <div key={idx} className="py-6 border-b border-black/10">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div>
                            <div className="flex items-center gap-3">
                              <h4 className="font-heading font-bold text-lg tracking-tight">
                                {breach.name}
                              </h4>
                              <span className={`font-mono text-[8px] tracking-[0.15em] uppercase border px-2 py-0.5 ${severity.style}`}>
                                {severity.label}
                              </span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            {breach.date && (
                              <span className="font-mono text-[10px] tracking-[0.1em] text-black/60">
                                {new Date(breach.date).toLocaleDateString('fr-FR')}
                              </span>
                            )}
                          </div>
                        </div>

                        {breach.description && (
                          <p className="text-black/50 text-sm leading-relaxed mb-4">
                            {breach.description}
                          </p>
                        )}

                        {breach.dataTypes.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {breach.dataTypes.map((dataType, i) => (
                              <span
                                key={i}
                                className="font-mono text-[9px] tracking-[0.1em] text-black/60 uppercase border border-black/15 px-2 py-1"
                              >
                                {dataType}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Security Tips */}
      <div>
        <span className="font-mono text-[10px] tracking-[0.3em] text-black/50 uppercase block mb-6">
          Conseils de sécurité
        </span>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border-[2px] border-black">
          {securityTips.map((tip, i) => (
            <div key={i} className={`p-5 ${i < 3 ? 'border-r border-black' : ''} ${i < 2 ? 'border-b md:border-b-0' : i === 2 ? 'border-b md:border-b-0' : ''}`}>
              <p className="font-heading font-bold text-sm tracking-tight mb-1">
                {tip.title}
              </p>
              <p className="text-black/60 text-xs leading-relaxed">{tip.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
