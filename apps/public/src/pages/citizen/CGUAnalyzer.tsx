import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Link as LinkIcon } from 'lucide-react';
import { cguApi } from '@/lib/api';
import { getScoreLabel, getPointLabel, type AnalysisPointType } from './CGUAnalyzer.utils';

interface AnalysisPoint {
  type: AnalysisPointType;
  title: string;
  description: string;
  article?: string;
}

interface AnalysisResult {
  serviceName: string;
  score: number;
  summary: string;
  points: AnalysisPoint[];
}

function CGUAnimation() {
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

    const draw = () => {
      if (document.hidden) {
        animId = requestAnimationFrame(draw);
        return;
      }
      const w = canvas.width / 2;
      const h = canvas.height / 2;
      ctx.clearRect(0, 0, w, h);
      t += 0.012;

      const docX = w * 0.35;
      const docY = h * 0.1;
      const docW = w * 0.35;
      const docH = h * 0.8;

      ctx.fillStyle = 'rgba(0,0,0,0.02)';
      ctx.fillRect(docX + 6, docY + 6, docW, docH);

      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillRect(docX, docY, docW, docH);
      ctx.strokeStyle = 'rgba(0,0,0,0.12)';
      ctx.lineWidth = 1;
      ctx.strokeRect(docX, docY, docW, docH);

      const lineCount = 14;
      for (let i = 0; i < lineCount; i++) {
        const ly = docY + 18 + i * ((docH - 36) / lineCount);
        const lw = docW - 24 - (Math.sin(i * 1.7 + 0.5) * 15 + 15);

        const scanPos = ((Math.sin(t * 1.5) + 1) / 2) * lineCount;
        const distToScan = Math.abs(i - scanPos);
        const highlight = Math.max(0, 1 - distToScan / 2);

        if (highlight > 0.1) {
          ctx.fillStyle = `rgba(33,178,170,${highlight * 0.08})`;
          ctx.fillRect(docX + 10, ly - 5, lw + 4, 10);
        }

        ctx.beginPath();
        ctx.moveTo(docX + 12, ly);
        ctx.lineTo(docX + 12 + lw, ly);
        ctx.strokeStyle = `rgba(0,0,0,${0.08 + highlight * 0.08})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      const scanY = docY + 10 + ((Math.sin(t * 1.5) + 1) / 2) * (docH - 20);
      ctx.beginPath();
      ctx.moveTo(docX - 8, scanY);
      ctx.lineTo(docX + docW + 8, scanY);
      ctx.strokeStyle = 'rgba(33,178,170,0.25)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      const grad = ctx.createLinearGradient(docX, scanY - 20, docX, scanY + 20);
      grad.addColorStop(0, 'rgba(33,178,170,0)');
      grad.addColorStop(0.5, 'rgba(33,178,170,0.06)');
      grad.addColorStop(1, 'rgba(33,178,170,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(docX, scanY - 20, docW, 40);

      const magAngle = t * 0.8;
      const magX = docX + docW * 0.5 + Math.cos(magAngle) * (docW * 0.55);
      const magY = docY + docH * 0.4 + Math.sin(magAngle) * (docH * 0.35);
      const magR = 22;

      ctx.beginPath();
      ctx.arc(magX, magY, magR, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(33,178,170,0.02)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      ctx.lineWidth = 2;
      ctx.stroke();

      const handleAngle = magAngle + Math.PI * 0.25;
      ctx.beginPath();
      ctx.moveTo(magX + Math.cos(handleAngle) * magR, magY + Math.sin(handleAngle) * magR);
      ctx.lineTo(magX + Math.cos(handleAngle) * (magR + 18), magY + Math.sin(handleAngle) * (magR + 18));
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(magX - 5, magY - 5, 6, Math.PI * 1.2, Math.PI * 1.7);
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      for (let i = 0; i < 5; i++) {
        const angle = t * 0.5 + i * Math.PI * 0.4;
        const dist = 35 + Math.sin(t * 2 + i) * 8;
        const px = magX + Math.cos(angle) * dist;
        const py = magY + Math.sin(angle) * dist;
        const alpha = (Math.sin(t * 3 + i * 1.5) + 1) / 2 * 0.12;

        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(33,178,170,${alpha})`;
        ctx.fill();
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
      style={{ left: '35%', width: '65%' }}
    />
  );
}

export function CGUAnalyzer() {
  const [mode, setMode] = useState<'url' | 'paste'>('paste');
  const [urlInput, setUrlInput] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyze = async (body: { text?: string; url?: string }) => {
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const data = await cguApi.analyze(body);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUrlAnalysis = () => {
    if (!urlInput.trim()) return;
    analyze({ url: urlInput.trim() });
  };

  const handlePasteAnalysis = () => {
    if (!pastedText.trim()) return;
    analyze({ text: pastedText.trim() });
  };

  return (
    <div className="space-y-10">
      {/* Header with animation */}
      <div className="relative min-h-[180px] sm:min-h-[200px]">
        <CGUAnimation />

        <div className="relative z-10 max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <span className="font-mono text-[10px] tracking-[0.3em] text-brand-turquoise/60 uppercase">Analyseur</span>
            <span className="font-mono text-[9px] tracking-[0.2em] text-brand-turquoise uppercase border border-brand-turquoise/30 px-2 py-0.5">IA</span>
          </div>
          <h1 className="font-heading font-bold text-3xl sm:text-4xl tracking-tighter leading-[0.95]">
            Comprenez les CGU<br />
            <span className="italic font-normal">en un coup d'oeil.</span>
          </h1>
          <p className="mt-4 text-black/50 text-sm leading-relaxed">
            Découvrez ce que cachent les conditions d'utilisation des services que vous utilisez.
          </p>
        </div>
      </div>

      {/* Mode Toggle */}
      {!result && !isAnalyzing && (
        <>
          <div className="flex gap-0">
            <button
              onClick={() => { setMode('paste'); setError(null); }}
              className={`px-5 py-3 text-[11px] font-medium tracking-[0.15em] uppercase border-2 border-r-0 transition-colors duration-100 ${
                mode === 'paste' ? 'bg-black text-white border-black' : 'border-black/15 text-black/40 hover:text-black hover:border-black'
              }`}
            >
              Coller des CGU
            </button>
            <button
              onClick={() => { setMode('url'); setError(null); }}
              className={`px-5 py-3 text-[11px] font-medium tracking-[0.15em] uppercase border-2 transition-colors duration-100 ${
                mode === 'url' ? 'bg-black text-white border-black' : 'border-black/15 text-black/40 hover:text-black hover:border-black'
              }`}
            >
              Depuis une URL
            </button>
          </div>

          {/* URL Mode */}
          {mode === 'url' && (
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1 flex items-center border-2 border-black/15 focus-within:border-black transition-colors">
                  <LinkIcon size={14} className="ml-4 text-black/25 shrink-0" strokeWidth={1.5} />
                  <input
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com/cgu"
                    onKeyDown={(e) => e.key === 'Enter' && handleUrlAnalysis()}
                    className="flex-1 px-3 py-3 text-sm placeholder:text-black/25 focus:outline-none bg-transparent"
                  />
                </div>
                <button
                  onClick={handleUrlAnalysis}
                  disabled={!urlInput.trim()}
                  className="px-6 py-3 bg-black text-white text-[11px] font-medium tracking-[0.15em] uppercase border-2 border-black hover:bg-white hover:text-black transition-colors duration-100 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Search size={14} strokeWidth={1.5} /> Analyser
                </button>
              </div>
            </div>
          )}

          {/* Paste Mode */}
          {mode === 'paste' && (
            <div className="space-y-4">
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Collez ici le texte des CGU/CGV que vous souhaitez analyser..."
                rows={8}
                className="w-full px-4 py-3 border-2 border-black/15 text-sm placeholder:text-black/25 focus:border-black focus:outline-none transition-colors resize-none"
              />
              <button
                onClick={handlePasteAnalysis}
                disabled={!pastedText.trim()}
                className="px-6 py-3 bg-black text-white text-[11px] font-medium tracking-[0.15em] uppercase border-2 border-black hover:bg-white hover:text-black transition-colors duration-100 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Analyser
              </button>
            </div>
          )}
        </>
      )}

      {/* Error */}
      {error && (
        <div className="border-2 border-black p-5">
          <p className="text-sm text-black/70">{error}</p>
          <button
            onClick={() => { setError(null); }}
            className="mt-3 px-4 py-2 border-2 border-black text-[11px] font-medium tracking-[0.15em] uppercase hover:bg-black hover:text-white transition-colors duration-100"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Loading */}
      {isAnalyzing && (
        <div className="border-2 border-black/15 p-8 sm:p-12 flex flex-col items-center gap-4">
          <Loader2 size={28} className="animate-spin text-black/50" strokeWidth={1.5} />
          <div className="text-center">
            <p className="font-heading font-bold text-sm tracking-tight">
              Analyse en cours...
            </p>
            <p className="text-black/60 text-xs mt-1">L'IA examine les conditions d'utilisation</p>
          </div>
          {/* Skeleton lines */}
          <div className="w-full max-w-md space-y-3 mt-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className="w-12 h-5 bg-black/5 animate-pulse shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 bg-black/5 animate-pulse" style={{ width: `${70 + Math.random() * 30}%` }} />
                  <div className="h-3 bg-black/[0.03] animate-pulse" style={{ width: `${50 + Math.random() * 40}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-8">
          {/* Score */}
          <div className="border-2 border-black p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-start gap-6">
              <div className="shrink-0">
                <span className="text-5xl font-bold tracking-tighter block">
                  {result.score}
                </span>
                <span className="font-mono text-[10px] tracking-[0.15em] text-black/60 uppercase">/100 · {getScoreLabel(result.score)}</span>
              </div>
              <div className="flex-1">
                <h2 className="font-heading font-bold text-xl tracking-tight mb-2">
                  {result.serviceName}
                </h2>
                <p className="text-black/50 text-sm leading-relaxed">{result.summary}</p>
              </div>
            </div>
          </div>

          {/* Points */}
          {result.points.length > 0 && (
            <div>
              <span className="font-mono text-[10px] tracking-[0.3em] text-black/50 uppercase block mb-6">
                Points d'attention
              </span>
              <div className="border-t-[2px] border-black">
                {result.points.map((point, idx) => (
                  <div key={idx} className="py-5 border-b border-black/10">
                    <div className="flex items-start gap-4">
                      <span className={`font-mono text-[9px] tracking-[0.2em] uppercase px-2 py-1 border shrink-0 mt-0.5 ${
                        point.type === 'danger' ? 'border-black text-black' :
                        point.type === 'warning' ? 'border-black/40 text-black/60' :
                        point.type === 'good' ? 'border-brand-turquoise/40 text-brand-turquoise' :
                        'border-black/20 text-black/50'
                      }`}>
                        {getPointLabel(point.type)}
                      </span>
                      <div>
                        <h4 className="font-heading font-bold text-sm tracking-tight">
                          {point.title}
                        </h4>
                        <p className="text-black/50 text-sm leading-relaxed mt-1">{point.description}</p>
                        {point.article && (
                          <p className="font-mono text-[9px] tracking-[0.1em] text-black/25 uppercase mt-2">
                            {point.article}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap gap-6 font-mono text-[9px] tracking-[0.1em] text-black/50 uppercase">
            <span><span className="inline-block w-2 h-2 bg-black mr-2" />Alerte</span>
            <span><span className="inline-block w-2 h-2 bg-black/40 mr-2" />Attention</span>
            <span><span className="inline-block w-2 h-2 bg-brand-turquoise mr-2" />OK</span>
            <span><span className="inline-block w-2 h-2 bg-black/15 mr-2" />Info</span>
          </div>

          <button
            onClick={() => { setResult(null); setUrlInput(''); setPastedText(''); setError(null); }}
            className="px-6 py-3 border-2 border-black text-[11px] font-medium tracking-[0.15em] uppercase hover:bg-black hover:text-white transition-colors duration-100"
          >
            Nouvelle analyse
          </button>
        </div>
      )}

      {/* Info footer */}
      <div className="grid grid-cols-3 gap-0 border-[2px] border-black">
        {[
          { title: 'Vie privée', text: 'Comment vos données sont collectées et utilisées.' },
          { title: 'Partage', text: 'Avec qui vos informations sont partagées.' },
          { title: 'Tracking', text: 'Comment votre activité est suivie.' },
        ].map((item, i) => (
          <div key={i} className={`p-5 ${i < 2 ? 'border-r border-black' : ''}`}>
            <p className="font-heading font-bold text-sm tracking-tight mb-1">
              {item.title}
            </p>
            <p className="text-black/60 text-xs leading-relaxed">{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
