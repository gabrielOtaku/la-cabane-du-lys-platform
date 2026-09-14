import type { SVGProps } from "react";

/**
 * Icônes de marques retirées de lucide-react 1.x (les logos ne font plus partie de la bibliothèque).
 * Tracé repris de lucide 0.4xx (licence ISC), même API que les icônes lucide : `size`, `strokeWidth`, `className`.
 */
type BrandIconProps = SVGProps<SVGSVGElement> & { size?: number | string; strokeWidth?: number | string };

export function Youtube({ size = 24, strokeWidth = 2, ...rest }: BrandIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <path d="m10 15 5-3-5-3z" />
    </svg>
  );
}
