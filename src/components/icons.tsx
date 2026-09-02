import type { SVGProps } from "react";

/**
 * Jeu d'icônes maison, tracé au trait sur une grille de 24 px.
 * Aucune librairie externe : le poids reste minimal et le style parfaitement
 * homogène (même graisse, mêmes terminaisons arrondies) sur tout le site.
 */

const paths: Record<string, React.ReactNode> = {
  /* ---------------------------------------------------------- plomberie */
  droplet: (
    <path d="M12 3.2c3.4 4 5.6 6.7 5.6 9.5A5.6 5.6 0 0 1 12 18.3a5.6 5.6 0 0 1-5.6-5.6c0-2.8 2.2-5.5 5.6-9.5Z" />
  ),
  faucet: (
    <>
      <path d="M4 13h5v3a3 3 0 0 0 3 3 3 3 0 0 0 3-3v-3" />
      <path d="M9 13V9.5A2.5 2.5 0 0 1 11.5 7H14" />
      <path d="M14 5h5v4h-5z" />
      <path d="M6.5 13v-2" />
    </>
  ),
  bath: (
    <>
      <path d="M3 12h18v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-3Z" />
      <path d="M6 12V6.5A2.5 2.5 0 0 1 8.5 4h.5" />
      <path d="M7 19.5 6 21M17 19.5 18 21" />
    </>
  ),
  boiler: (
    <>
      <rect x="5" y="3" width="14" height="14" rx="3" />
      <path d="M9 20v1M15 20v1M12 17v3" />
      <path d="M12 7v3M9.8 9.5h4.4" />
    </>
  ),
  drain: (
    <>
      <circle cx="12" cy="12" r="7.5" />
      <path d="M12 4.5v15M4.5 12h15" />
      <circle cx="12" cy="12" r="2" />
    </>
  ),
  pipe: (
    <>
      <path d="M3 8h6a3 3 0 0 1 3 3v2a3 3 0 0 0 3 3h6" />
      <path d="M3 6v4M21 14v4" />
    </>
  ),
  radar: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 12 18 7" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
  wrench: (
    <>
      <path d="M15.5 3.5a5 5 0 0 0-5.9 6.6L3.6 16a2 2 0 1 0 2.8 2.8l5.9-6a5 5 0 0 0 6.6-5.9l-2.7 2.7-2.6-.7-.7-2.6Z" />
    </>
  ),
  gauge: (
    <>
      <path d="M4 16a8 8 0 1 1 16 0" />
      <path d="M12 16l3.5-4" />
      <path d="M4 16h2M18 16h2" />
    </>
  ),
  truck: (
    <>
      <path d="M3 7h10v9H3zM13 10h4l3 3v3h-7" />
      <circle cx="7" cy="18" r="1.6" />
      <circle cx="17" cy="18" r="1.6" />
    </>
  ),

  /* -------------------------------------------------------- électricité */
  bolt: <path d="M13.5 2.5 5 13.5h5.5L10 21.5 19 10h-5.8l.3-7.5Z" />,
  panel: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="2.5" />
      <path d="M7 8h4M7 12h4M7 16h4" />
      <path d="M14.5 7.5h3v3h-3zM14.5 13.5h3v3h-3z" />
    </>
  ),
  socket: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
      <circle cx="9.5" cy="10.5" r="1.2" />
      <circle cx="14.5" cy="10.5" r="1.2" />
      <path d="M9 15h6" />
    </>
  ),
  switch: (
    <>
      <rect x="5" y="3.5" width="14" height="17" rx="2.5" />
      <path d="M9.5 9h5v6h-5z" />
    </>
  ),
  bulb: (
    <>
      <path d="M9 17a5.5 5.5 0 1 1 6 0v1.5a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 18.5V17Z" />
      <path d="M10 21h4" />
    </>
  ),
  scan: (
    <>
      <path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16" />
      <path d="M4 12h16" />
    </>
  ),
  shield: <path d="M12 3 5 5.8v5.4c0 4 2.9 7.6 7 9.3 4.1-1.7 7-5.3 7-9.3V5.8L12 3Z" />,
  lamp: (
    <>
      <path d="M7 4h10l3 6H4l3-6Z" />
      <path d="M12 10v7M9.5 20h5" />
    </>
  ),
  upgrade: (
    <>
      <path d="M12 20V7" />
      <path d="m7.5 11 4.5-5 4.5 5" />
      <path d="M4.5 20h15" />
    </>
  ),

  /* ------------------------------------------------------------ interface */
  phone: (
    <path d="M6.5 3.5h3l1.5 4-2 1.4a12.5 12.5 0 0 0 6.1 6.1l1.4-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2Z" />
  ),
  whatsapp: (
    <>
      <path d="M3.8 20.2 5 16.4A8 8 0 1 1 8 19.3l-4.2.9Z" />
      <path d="M9 9.4c.3 2.6 2.7 4.9 5.3 5.2.5.1 1-.3 1.1-.8l.1-.7-2-.9-.8.9a6.3 6.3 0 0 1-2.2-2.2l.9-.8-.9-2-.7.1c-.5.1-.9.6-.8 1.2Z" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m3.8 7 7.1 5.2a2 2 0 0 0 2.2 0L20.2 7" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  camera: (
    <>
      <path d="M3.5 8.5h3l1.5-2.5h8L17.5 8.5h3v10h-17v-10Z" />
      <circle cx="12" cy="13" r="3.2" />
    </>
  ),
  close: <path d="m6 6 12 12M18 6 6 18" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  chevronRight: <path d="m9.5 5 7 7-7 7" />,
  chevronDown: <path d="m5 9.5 7 7 7-7" />,
  arrowRight: <path d="M4 12h15m-6-6 6 6-6 6" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  star: <path d="m12 3.5 2.7 5.5 6 .9-4.4 4.2 1.1 6-5.4-2.9-5.4 2.9 1.1-6L3.3 9.9l6-.9L12 3.5Z" />,
  spark: (
    <>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
      <path d="m6.2 6.2 2.6 2.6M15.2 15.2l2.6 2.6M17.8 6.2l-2.6 2.6M8.8 15.2l-2.6 2.6" />
    </>
  ),
  home: (
    <>
      <path d="m4 10.5 8-6.5 8 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19v-8.5Z" />
      <path d="M9.5 20.5V14h5v6.5" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8.5" r="3.8" />
      <path d="M4.8 20a7.2 7.2 0 0 1 14.4 0" />
    </>
  ),
  send: <path d="M4.5 12 20 4.5 15.5 20l-4-6.5-7-1.5Z" />,
  plus: <path d="M12 5v14M5 12h14" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </>
  ),
  alert: (
    <>
      <path d="M12 4 2.8 20h18.4L12 4Z" />
      <path d="M12 10v4M12 17h.01" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.6 12h16.8M12 3.6c2.2 2.4 3.3 5.3 3.3 8.4s-1.1 6-3.3 8.4c-2.2-2.4-3.3-5.3-3.3-8.4s1.1-6 3.3-8.4Z" />
    </>
  ),
  logout: (
    <>
      <path d="M14 4.5h4.5A1.5 1.5 0 0 1 20 6v12a1.5 1.5 0 0 1-1.5 1.5H14" />
      <path d="M10 8.5 6 12l4 3.5M6 12h9" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20V4" />
      <path d="M4 20h16" />
      <path d="M8 17v-5M12.5 17V8M17 17v-7" />
    </>
  ),
  filter: <path d="M4 6h16l-6 7v5l-4 2v-7L4 6Z" />,
  trash: (
    <>
      <path d="M4.5 7h15M9 7V5h6v2M6.5 7l1 12.5h9L17.5 7" />
    </>
  ),
  edit: <path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17v3Z" />,
  refresh: (
    <>
      <path d="M20 12a8 8 0 1 1-2.6-5.9" />
      <path d="M20 4v4.5h-4.5" />
    </>
  ),
  badge: (
    <>
      <circle cx="12" cy="9.5" r="5.5" />
      <path d="m8.5 14-1.5 6 5-2.5 5 2.5-1.5-6" />
    </>
  ),
  gift: (
    <>
      <rect x="3.5" y="9" width="17" height="11" rx="2" />
      <path d="M3.5 13h17M12 9v11" />
      <path d="M12 9S9 4.5 7 5.6C5.4 6.5 6.2 9 8.5 9M12 9s3-4.5 5-3.4C18.6 6.5 17.8 9 15.5 9" />
    </>
  ),
};

export type IconName = keyof typeof paths;

interface IconProps extends SVGProps<SVGSVGElement> {
  name: string;
  size?: number;
  filled?: boolean;
}

export function Icon({ name, size = 24, filled = false, ...props }: IconProps) {
  const content = paths[name] ?? paths.spark;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={filled ? "currentColor" : "none"}
      stroke={filled ? "none" : "currentColor"}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {content}
    </svg>
  );
}

export const iconNames = Object.keys(paths);
