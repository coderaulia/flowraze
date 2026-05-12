import { type HTMLAttributes } from 'react';

interface EyebrowProps extends HTMLAttributes<HTMLSpanElement> {
  dot?: boolean;
}

export function Eyebrow({ dot = true, children, style, ...props }: EyebrowProps) {
  return (
    <span className="lp-eyebrow" style={style} {...props}>
      {dot && <span className="lp-pill-dot" />}
      {children}
    </span>
  );
}
