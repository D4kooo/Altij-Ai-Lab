export type AnalysisPointType = 'good' | 'warning' | 'danger' | 'info';

export function getScoreLabel(score: number): string {
  if (score >= 70) return 'Bon';
  if (score >= 50) return 'Moyen';
  return 'Préoccupant';
}

export function getPointLabel(type: AnalysisPointType): string {
  switch (type) {
    case 'good': return 'OK';
    case 'warning': return 'Attention';
    case 'danger': return 'Alerte';
    case 'info': return 'Info';
  }
}
