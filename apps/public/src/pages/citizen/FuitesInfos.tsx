import { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Loader2, ExternalLink, ChevronDown, Database, Users, Calendar, X, Copy, Check } from 'lucide-react';
import { fuitesApi } from '@/lib/api';

interface BreachEntry {
  name: string;
  service_type: string;
  date: string;
  records_count: number | null;
  records_count_raw: string;
  data_types: string[];
  site_url: string | null;
  logo_url: string;
  source_url: string | null;
  status: string;
  incident_label: string | null;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1).replace('.0', '')} Mrd`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')} M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace('.0', '')} k`;
  return n.toLocaleString('fr-FR');
}

function normalizeString(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function LogoFallback({ name }: { name: string }) {
  const initials = name.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className="w-[60px] h-[44px] bg-black/5 border border-black/10 flex items-center justify-center shrink-0">
      <span className="font-mono text-[10px] tracking-[0.1em] text-black/60 font-bold">{initials}</span>
    </div>
  );
}

export function FuitesInfos() {
  const [data, setData] = useState<BreachEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'records_desc' | 'records_asc'>('recent');
  const [selectedBreach, setSelectedBreach] = useState<BreachEntry | null>(null);
  const [copied, setCopied] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedBreach) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setSelectedBreach(null); return; }
      if (e.key !== 'Tab') return;

      const modal = modalRef.current;
      if (!modal) return;
      const focusable = modal.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Auto-focus the first focusable element
    const modal = modalRef.current;
    if (modal) {
      const firstBtn = modal.querySelector<HTMLElement>('button');
      firstBtn?.focus();
    }

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedBreach]);

  useEffect(() => {
    async function fetchData() {
      try {
        const json = await fuitesApi.getInfos();
        setData(json);
      } catch {
        setError('Impossible de charger les données. Réessayez plus tard.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const years = useMemo(() => {
    const set = new Set(data.map(d => d.date?.slice(0, 4)).filter(Boolean));
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [data]);

  const currentYear = new Date().getFullYear().toString();

  const filtered = useMemo(() => {
    let items = [...data];

    if (search.trim()) {
      const q = normalizeString(search.trim());
      items = items.filter(d =>
        normalizeString(d.name).includes(q) ||
        normalizeString(d.service_type || '').includes(q)
      );
    }

    if (yearFilter !== 'all') {
      items = items.filter(d => d.date?.startsWith(yearFilter));
    }

    if (statusFilter !== 'all') {
      items = items.filter(d => normalizeString(d.status) === normalizeString(statusFilter));
    }

    items.sort((a, b) => {
      switch (sortBy) {
        case 'recent': return (b.date || '').localeCompare(a.date || '');
        case 'oldest': return (a.date || '').localeCompare(b.date || '');
        case 'records_desc': return (b.records_count || 0) - (a.records_count || 0);
        case 'records_asc': return (a.records_count || 0) - (b.records_count || 0);
        default: return 0;
      }
    });

    return items;
  }, [data, search, yearFilter, statusFilter, sortBy]);

  const stats = useMemo(() => {
    const totalRecords = data.reduce((sum, d) => sum + (d.records_count || 0), 0);
    const thisYear = data.filter(d => d.date?.startsWith(currentYear)).length;
    return { totalRecords, thisYear, total: data.length };
  }, [data, currentYear]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={24} className="animate-spin text-black/50" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="border-2 border-black p-8 text-center">
        <p className="text-sm text-black/60">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <span className="font-mono text-[10px] tracking-[0.3em] text-brand-turquoise/60 uppercase block mb-4">Recensement</span>
        <h1 className="font-heading font-bold text-3xl sm:text-4xl tracking-tighter leading-[0.95]">
          Fuites de donn&eacute;es<br />
          <span className="italic font-normal">en France</span>
        </h1>
        <p className="mt-4 text-black/50 text-sm leading-relaxed max-w-lg">
          Catalogue des violations de donn&eacute;es r&eacute;f&eacute;renc&eacute;es impactant le territoire fran&ccedil;ais.
          Source&nbsp;: <a href="https://fuitesinfos.fr" target="_blank" rel="noopener noreferrer" className="underline hover:text-black transition-colors">fuitesinfos.fr</a>
        </p>
      </div>

      {/* Counters */}
      <div className="grid grid-cols-3 gap-0 border-[2px] border-black">
        <div className="p-5 border-r border-black">
          <div className="flex items-center gap-2 mb-2">
            <Users size={14} strokeWidth={1.5} className="text-black/50" />
            <span className="font-mono text-[9px] tracking-[0.15em] text-black/50 uppercase">Personnes concern&eacute;es</span>
          </div>
          <p className="font-heading font-bold text-2xl sm:text-3xl tracking-tighter">
            {formatNumber(stats.totalRecords)}
          </p>
        </div>
        <div className="p-5 border-r border-black">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={14} strokeWidth={1.5} className="text-black/50" />
            <span className="font-mono text-[9px] tracking-[0.15em] text-black/50 uppercase">Fuites en {currentYear}</span>
          </div>
          <p className="font-heading font-bold text-2xl sm:text-3xl tracking-tighter">
            {stats.thisYear}
          </p>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <Database size={14} strokeWidth={1.5} className="text-black/50" />
            <span className="font-mono text-[9px] tracking-[0.15em] text-black/50 uppercase">Total r&eacute;f&eacute;renc&eacute;es</span>
          </div>
          <p className="font-heading font-bold text-2xl sm:text-3xl tracking-tighter">
            {stats.total}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="border-2 border-black p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/25" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une entreprise..."
              className="w-full pl-9 pr-4 py-2.5 border-2 border-black/15 text-sm placeholder:text-black/25 focus:border-black focus:outline-none transition-colors"
            />
          </div>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="px-3 py-2.5 border-2 border-black/15 text-sm bg-white focus:border-black focus:outline-none transition-colors cursor-pointer"
          >
            <option value="all">Toutes les ann&eacute;es</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 border-2 border-black/15 text-sm bg-white focus:border-black focus:outline-none transition-colors cursor-pointer"
          >
            <option value="all">Tous les statuts</option>
            <option value="Confirm&eacute;e">Confirm&eacute;e</option>
            <option value="Revendiqu&eacute;e">Revendiqu&eacute;e</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 py-2.5 border-2 border-black/15 text-sm bg-white focus:border-black focus:outline-none transition-colors cursor-pointer"
          >
            <option value="recent">Plus r&eacute;centes</option>
            <option value="oldest">Plus anciennes</option>
            <option value="records_desc">Volume &#x2193;</option>
            <option value="records_asc">Volume &#x2191;</option>
          </select>
        </div>
        <p className="font-mono text-[9px] tracking-[0.1em] text-black/25 uppercase mt-3">
          {filtered.length} r&eacute;sultat{filtered.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Breach List */}
      <div>
        <span className="font-mono text-[10px] tracking-[0.3em] text-black/50 uppercase block mb-6">
          Incidents référencés
        </span>

        {filtered.length === 0 ? (
          <div className="border-2 border-black p-8 text-center">
            <p className="text-sm text-black/50">Aucun résultat pour ces filtres.</p>
          </div>
        ) : (
          <div className="border-t-[2px] border-black">
            {filtered.map((breach, idx) => {
              const statusNorm = normalizeString(breach.status);
              const isConfirmed = statusNorm === 'confirmee';

              return (
                <button
                  key={`${breach.name}-${breach.date}-${idx}`}
                  onClick={() => { setSelectedBreach(breach); setCopied(false); }}
                  className="w-full text-left py-5 border-b border-black/10 flex items-start gap-4 hover:bg-black/[0.02] transition-colors cursor-pointer group"
                >
                  {/* Logo */}
                  {breach.logo_url ? (
                    <img
                      src={breach.logo_url}
                      alt={breach.name}
                      className="w-[60px] h-[44px] object-contain bg-white border border-black/10 shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  {breach.logo_url ? (
                    <div className="hidden"><LogoFallback name={breach.name} /></div>
                  ) : (
                    <LogoFallback name={breach.name} />
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-heading font-bold text-base tracking-tight truncate group-hover:text-brand-turquoise transition-colors">
                        {breach.name}
                      </h3>
                      <span className={`font-mono text-[8px] tracking-[0.15em] uppercase border px-2 py-0.5 shrink-0 ${
                        isConfirmed ? 'border-black/60 text-black' : 'border-black/20 text-black/60'
                      }`}>
                        {breach.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {breach.service_type && (
                        <span className="font-mono text-[9px] tracking-[0.1em] text-black/35 uppercase">{breach.service_type}</span>
                      )}
                      {breach.date && (
                        <span className="font-mono text-[9px] tracking-[0.1em] text-black/25">
                          {new Date(breach.date).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </div>
                    {breach.records_count ? (
                      <p className="text-sm text-black/60 mt-2">
                        <span className="font-bold">
                          {breach.records_count.toLocaleString('fr-FR')}
                        </span> personnes concernées
                      </p>
                    ) : breach.incident_label ? (
                      <p className="text-sm text-black/60 mt-2">{breach.incident_label}</p>
                    ) : null}
                  </div>

                  <ChevronDown size={16} strokeWidth={1.5} className="shrink-0 mt-1 text-black/20 group-hover:text-black/40 transition-colors" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedBreach && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedBreach(null)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* Modal */}
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-label="Détail de la fuite"
            className="relative bg-white border-2 border-black w-full max-w-2xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={() => setSelectedBreach(null)}
              className="absolute top-4 right-4 p-1.5 text-black/30 hover:text-black transition-colors z-10"
              aria-label="Fermer"
            >
              <X size={18} strokeWidth={1.5} />
            </button>

            <div className="p-6 sm:p-8 space-y-6">
              {/* Header */}
              <div className="flex items-start gap-4 pr-8">
                {selectedBreach.logo_url ? (
                  <img
                    src={selectedBreach.logo_url}
                    alt={selectedBreach.name}
                    className="w-[72px] h-[54px] object-contain bg-white border border-black/10 shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <LogoFallback name={selectedBreach.name} />
                )}
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="font-heading font-bold text-xl tracking-tight">
                      {selectedBreach.name}
                    </h2>
                    <span className={`font-mono text-[8px] tracking-[0.15em] uppercase border px-2 py-0.5 ${
                      normalizeString(selectedBreach.status) === 'confirmee' ? 'border-black/60 text-black' : 'border-black/20 text-black/60'
                    }`}>
                      {selectedBreach.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {selectedBreach.service_type && (
                      <span className="font-mono text-[9px] tracking-[0.1em] text-black/35 uppercase">{selectedBreach.service_type}</span>
                    )}
                    {selectedBreach.date && (
                      <span className="font-mono text-[9px] tracking-[0.1em] text-black/25">
                        {new Date(selectedBreach.date).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Volume */}
              {(selectedBreach.records_count || selectedBreach.incident_label) && (
                <div className="border-2 border-black p-4">
                  <span className="font-mono text-[9px] tracking-[0.15em] text-black/50 uppercase block mb-2">Volume</span>
                  {selectedBreach.records_count ? (
                    <p className="font-heading font-bold text-2xl tracking-tighter">
                      {selectedBreach.records_count.toLocaleString('fr-FR')}
                      <span className="text-sm font-normal text-black/50 ml-2">personnes concernées</span>
                    </p>
                  ) : (
                    <p className="text-sm text-black/50">{selectedBreach.incident_label}</p>
                  )}
                </div>
              )}

              {/* Description */}
              {selectedBreach.records_count_raw && (
                <div>
                  <span className="font-mono text-[9px] tracking-[0.15em] text-black/50 uppercase block mb-2">Description</span>
                  <p className="text-sm text-black/60 leading-relaxed">{selectedBreach.records_count_raw}</p>
                </div>
              )}

              {/* Data types */}
              {selectedBreach.data_types.length > 0 && (
                <div>
                  <span className="font-mono text-[9px] tracking-[0.15em] text-black/50 uppercase block mb-3">Données exposées</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedBreach.data_types.map((dt, i) => (
                      <span key={i} className="font-mono text-[9px] tracking-[0.1em] text-black/50 uppercase border border-black/15 px-3 py-1.5">
                        {dt}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-2 border-t border-black/10">
                {selectedBreach.source_url && (
                  <a
                    href={selectedBreach.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 border-2 border-black text-[10px] font-medium tracking-[0.15em] uppercase hover:bg-black hover:text-white transition-colors duration-100"
                  >
                    <ExternalLink size={12} strokeWidth={1.5} /> Source
                  </a>
                )}
                {selectedBreach.site_url && (
                  <a
                    href={selectedBreach.site_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 border-2 border-black/20 text-[10px] font-medium tracking-[0.15em] uppercase text-black/50 hover:border-black hover:text-black transition-colors duration-100"
                  >
                    <ExternalLink size={12} strokeWidth={1.5} /> Site officiel
                  </a>
                )}
                <button
                  onClick={() => {
                    const text = [
                      `${selectedBreach.name}`,
                      selectedBreach.date ? `Date : ${new Date(selectedBreach.date).toLocaleDateString('fr-FR')}` : null,
                      selectedBreach.records_count ? `Volume : ${selectedBreach.records_count.toLocaleString('fr-FR')} personnes` : null,
                      selectedBreach.data_types.length > 0 ? `Données : ${selectedBreach.data_types.join(', ')}` : null,
                      selectedBreach.source_url ? `Source : ${selectedBreach.source_url}` : null,
                    ].filter(Boolean).join('\n');
                    navigator.clipboard.writeText(text);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 border-2 border-black/20 text-[10px] font-medium tracking-[0.15em] uppercase text-black/50 hover:border-black hover:text-black transition-colors duration-100"
                >
                  {copied ? <><Check size={12} strokeWidth={1.5} /> Copié</> : <><Copy size={12} strokeWidth={1.5} /> Copier infos</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
