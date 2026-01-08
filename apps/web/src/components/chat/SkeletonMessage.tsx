import { cn } from '@/lib/utils';

interface SkeletonMessageProps {
  className?: string;
}

export function SkeletonMessage({ className }: SkeletonMessageProps) {
  return (
    <div className={cn('space-y-2.5 animate-pulse', className)}>
      <div className="h-4 bg-muted-foreground/20 rounded w-3/4" />
      <div className="h-4 bg-muted-foreground/20 rounded w-full" />
      <div className="h-4 bg-muted-foreground/20 rounded w-5/6" />
      <div className="h-4 bg-muted-foreground/20 rounded w-2/3" />
    </div>
  );
}
