/**
 * Marque : une goutte d'eau et un éclair partagent le même contour.
 * Les deux métiers de l'entreprise tiennent dans un seul signe — lisible dès
 * 24 px, donc utilisable en favicon comme en pied de page.
 */
export function Logo({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label="Wajdi & Tayssir Services Pro">
      <defs>
        <linearGradient id="logo-drop" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#67e2f9" />
          <stop offset="100%" stopColor="#0888ad" />
        </linearGradient>
        <linearGradient id="logo-bolt" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fcd34d" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="46" height="46" rx="14" fill="#08111f" />
      <rect
        x="1"
        y="1"
        width="46"
        height="46"
        rx="14"
        fill="none"
        stroke="url(#logo-drop)"
        strokeWidth="1.5"
        opacity="0.55"
      />
      <path
        d="M24 9c6.6 7.6 10 12.2 10 16.8A10 10 0 0 1 24 36a10 10 0 0 1-10-10.2C14 21.2 17.4 16.6 24 9Z"
        fill="url(#logo-drop)"
        opacity="0.92"
      />
      <path d="M25.6 15.5 19 25.4h4.4L22.6 33l7-10.4h-4.6l.6-7.1Z" fill="url(#logo-bolt)" />
    </svg>
  );
}
