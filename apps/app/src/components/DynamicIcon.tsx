import { memo } from 'react';
import { Bot } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface DynamicIconProps {
  name: string;
  className?: string;
  strokeWidth?: number;
}

export const DynamicIcon = memo(function DynamicIcon({ name, className, strokeWidth = 1.5 }: DynamicIconProps) {
  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>>)[name] || Bot;
  return <Icon className={className} strokeWidth={strokeWidth} />;
});
