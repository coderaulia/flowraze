import { type HTMLAttributes } from 'react';

interface SectionProps extends HTMLAttributes<HTMLElement> {
  containerClassName?: string;
}

export function Section({ className = '', containerClassName = '', children, ...props }: SectionProps) {
  return (
    <section className={`lp-section ${className}`.trim()} {...props}>
      <div className={`lp-container ${containerClassName}`.trim()}>{children}</div>
    </section>
  );
}
