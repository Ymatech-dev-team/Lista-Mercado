// Ícones do design-system — traço fino, herdam cor (currentColor) e tamanho via className.
import type { SVGProps } from "react";

function Icon({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const Check = (p: SVGProps<SVGSVGElement>) => (
  <Icon strokeWidth={3} {...p}><path d="M5 13l4 4L19 7" /></Icon>
);
export const Plus = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>
);
export const Minus = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M5 12h14" /></Icon>
);
export const Trash = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" /></Icon>
);
export const HomeIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M4 11l8-6 8 6v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z" /></Icon>
);
export const ListIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" /></Icon>
);
export const ClockIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></Icon>
);
export const UserIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><circle cx="12" cy="8" r="4" /><path d="M5 20c1.5-4 12-4 14 0" /></Icon>
);
export const AlertTriangle = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M12 3l9 16H3z" /><path d="M12 10v4M12 17h.01" /></Icon>
);
export const X = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M6 6l12 12M18 6L6 18" /></Icon>
);
export const Spinner = (p: SVGProps<SVGSVGElement>) => (
  <Icon strokeWidth={2.5} {...p}>
    <path d="M12 3a9 9 0 1 0 9 9" opacity={0.9} />
  </Icon>
);
