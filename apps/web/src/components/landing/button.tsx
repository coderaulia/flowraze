import { Slot } from '@radix-ui/react-slot';
import { type ButtonHTMLAttributes, forwardRef } from 'react';

interface LandingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost';
  size?: 'default' | 'lg';
  asChild?: boolean;
}

export const LandingButton = forwardRef<HTMLButtonElement, LandingButtonProps>(
  ({ variant = 'primary', size = 'default', asChild = false, className = '', ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    const cls = [
      'lp-btn',
      variant === 'primary' ? 'lp-btn-primary' : 'lp-btn-ghost',
      size === 'lg' ? 'lp-btn-lg' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return <Comp ref={ref} className={cls} {...props} />;
  }
);

LandingButton.displayName = 'LandingButton';
