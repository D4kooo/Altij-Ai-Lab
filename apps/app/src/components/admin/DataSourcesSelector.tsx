import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronRight, Database, AlertTriangle, Check } from 'lucide-react';
import {
  LEGAL_DATA_SOURCES,
  CATEGORY_LABELS,
  getAllCategories,
  type DataSourceCategory,
  type LegalDataSource,
} from '@altij/shared';
import { assistantsApi } from '@/lib/api';
import { Badge } from '@/components/ui/badge';

interface DataSourcesSelectorProps {
  selected: string[];
  onChange: (selected: string[]) => void;
}

const ACCESS_BADGES: Record<string, { label: string; className: string }> = {
  free: { label: 'Gratuit', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  paid: { label: 'Payant', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  restricted: { label: 'Restreint', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
};

export function DataSourcesSelector({ selected, onChange }: DataSourcesSelectorProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<DataSourceCategory>>(new Set());

  // Fetch connector status
  const { data: connectorsStatus } = useQuery({
    queryKey: ['data-sources-status'],
    queryFn: assistantsApi.getDataSourcesStatus,
    staleTime: 60_000,
  });

  const categories = getAllCategories();
  const sourcesByCategory = new Map<DataSourceCategory, LegalDataSource[]>();
  for (const cat of categories) {
    sourcesByCategory.set(cat, LEGAL_DATA_SOURCES.filter((s) => s.category === cat));
  }

  const toggleCategory = (cat: DataSourceCategory) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const toggleSource = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const toggleAllInCategory = (cat: DataSourceCategory) => {
    const sources = sourcesByCategory.get(cat) || [];
    const sourceIds = sources.map((s) => s.id);
    const allSelected = sourceIds.every((id) => selected.includes(id));

    if (allSelected) {
      onChange(selected.filter((id) => !sourceIds.includes(id)));
    } else {
      const newSelected = new Set([...selected, ...sourceIds]);
      onChange(Array.from(newSelected));
    }
  };

  const getSelectedCountForCategory = (cat: DataSourceCategory): number => {
    const sources = sourcesByCategory.get(cat) || [];
    return sources.filter((s) => selected.includes(s.id)).length;
  };

  const isConnectorConfigured = (source: LegalDataSource): boolean => {
    if (!source.requiresConfig) return true;
    if (!connectorsStatus) return true; // Don't show warning while loading
    return connectorsStatus[source.connector] ?? false;
  };

  return (
    <div className="space-y-1">
      {categories.map((cat) => {
        const sources = sourcesByCategory.get(cat) || [];
        if (sources.length === 0) return null;
        const isExpanded = expandedCategories.has(cat);
        const selectedCount = getSelectedCountForCategory(cat);

        return (
          <div key={cat} className="border rounded-lg overflow-hidden">
            <button
              type="button"
              className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted/50 transition-colors"
              onClick={() => toggleCategory(cat)}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <Database className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="text-sm font-medium flex-1">{CATEGORY_LABELS[cat]}</span>
              {selectedCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {selectedCount}/{sources.length}
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">{sources.length} sources</span>
            </button>

            {isExpanded && (
              <div className="border-t px-3 py-2 space-y-1">
                <button
                  type="button"
                  className="text-xs text-primary hover:underline mb-2"
                  onClick={() => toggleAllInCategory(cat)}
                >
                  {sources.every((s) => selected.includes(s.id))
                    ? 'Tout d\u00e9s\u00e9lectionner'
                    : 'Tout s\u00e9lectionner'}
                </button>

                {sources.map((source) => {
                  const isSelected = selected.includes(source.id);
                  const configured = isConnectorConfigured(source);
                  const badge = ACCESS_BADGES[source.access];

                  return (
                    <div
                      key={source.id}
                      role="button"
                      tabIndex={0}
                      className={`flex items-start gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                        isSelected ? 'bg-primary/5' : 'hover:bg-muted/30'
                      }`}
                      onClick={() => toggleSource(source.id)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSource(source.id); } }}
                    >
                      <div className="pt-0.5">
                        <div
                          className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-primary border-primary text-primary-foreground'
                              : 'border-muted-foreground/30'
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{source.name}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${badge.className}`}>
                            {badge.label}
                          </span>
                          {!configured && (
                            <span className="flex items-center gap-0.5 text-[10px] text-amber-600 dark:text-amber-400">
                              <AlertTriangle className="h-3 w-3" />
                              Non configur\u00e9
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {source.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {selected.length > 0 && (
        <p className="text-xs text-muted-foreground pt-1">
          {selected.length} source{selected.length > 1 ? 's' : ''} s\u00e9lectionn\u00e9e{selected.length > 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
