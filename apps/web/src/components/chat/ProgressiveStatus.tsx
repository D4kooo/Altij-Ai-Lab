import { useEffect, useState } from 'react';

const THINKING_STEPS = [
  { label: 'Analyse...', minDuration: 1500 },
  { label: 'Recherche...', minDuration: 1200 },
  { label: 'Redaction...', minDuration: 0 },
];

interface ProgressiveStatusProps {
  isActive: boolean;
  color: string;
}

export function ProgressiveStatus({ isActive, color }: ProgressiveStatusProps) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setStepIndex(0);
      return;
    }

    const step = THINKING_STEPS[stepIndex];
    if (step.minDuration > 0 && stepIndex < THINKING_STEPS.length - 1) {
      const timer = setTimeout(() => {
        setStepIndex((prev) => Math.min(prev + 1, THINKING_STEPS.length - 1));
      }, step.minDuration);
      return () => clearTimeout(timer);
    }
  }, [isActive, stepIndex]);

  if (!isActive) return null;

  const currentStep = THINKING_STEPS[stepIndex];

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 rounded-full animate-bounce"
            style={{
              backgroundColor: color,
              animationDelay: `${i * 150}ms`,
              animationDuration: '0.6s',
            }}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground ml-1">{currentStep.label}</span>
    </div>
  );
}
