import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, checked, ...props }, ref) => {
    const internalRef = React.useRef<HTMLInputElement>(null);

    // Combine refs: use internal ref and also forward to external ref if provided
    const setRefs = React.useCallback(
      (element: HTMLInputElement | null) => {
        (internalRef as React.MutableRefObject<HTMLInputElement | null>).current = element;
        if (typeof ref === 'function') {
          ref(element);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLInputElement | null>).current = element;
        }
      },
      [ref]
    );

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      onCheckedChange?.(event.target.checked);
    };

    const handleClick = () => {
      internalRef.current?.click();
    };

    return (
      <div className="relative flex items-center">
        <input
          type="checkbox"
          ref={setRefs}
          checked={checked}
          onChange={handleChange}
          className="peer sr-only"
          {...props}
        />
        <div
          className={cn(
            'h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background',
            'peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2',
            'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
            'peer-checked:bg-primary peer-checked:text-primary-foreground',
            'flex items-center justify-center cursor-pointer',
            className
          )}
          onClick={handleClick}
        >
          {checked && <Check className="h-3 w-3 text-primary-foreground" />}
        </div>
      </div>
    );
  }
);
Checkbox.displayName = 'Checkbox';

export { Checkbox };
