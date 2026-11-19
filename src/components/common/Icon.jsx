import React from 'react';

const paths = {
  factory: (
    <>
      <path d="M2 20h20V10l-7 4V8l-7 4V4H2z" />
      <path d="M6 17h1m5 0h1m5 0h1" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  box: (
    <>
      <path d="m12 3 9 5-9 5-9-5 9-5Zm-9 5v9l9 5 9-5V8M12 13v9M7.5 5.5l9 5" />
    </>
  ),
  layers: (
    <>
      <path d="m12 3 10 6-10 6L2 9l10-6ZM2 15l10 6 10-6M2 12l10 6 10-6" />
    </>
  ),
  clipboard: (
    <>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <rect x="9" y="2" width="6" height="4" rx="1" />
      <path d="M9 12h6m-6 4h4" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 4v3" />
    </>
  ),
  history: (
    <>
      <path d="M3 12a9 9 0 1 0 3-7L3 8m0-5v5h5m4-1v5l3 2" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  left: <path d="M19 12H5m6-6-6 6 6 6" />,
  down: <path d="m6 9 6 6 6-6" />,
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="7.5" />
      <path d="m16 16 5 5" />
    </>
  ),
  alert: <path d="m12 3 10 18H2L12 3Zm0 6v5m0 3v.01" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6m0-10v.01" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  checkCircle: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m7 12 3 3 7-7" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 11h18" />
    </>
  ),
  logout: <path d="M9 4H4v16h5m5-12 4 4-4 4m-6-4h10" />,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  x: <path d="m6 6 12 12M6 18 18 6" />,
  trash: <path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7" />,
  edit: <path d="m16 3 5 5-12 12-6 1 1-6L16 3Zm-2 2 5 5" />,
  play: <path d="m7 3 14 9-14 9V3Z" />,
  shield: (
    <>
      <path d="m12 3 8 3v6c0 5-8 10-8 10S4 17 4 12V6l8-3Z" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  refresh: <path d="M20 7A9 9 0 0 0 4 6L2 9m0-6v6h6m-4 8a9 9 0 0 0 16 1l2-3m0 6v-6h-6" />,
  upload: <path d="M4 16v5h16v-5M12 16V3m-5 5 5-5 5 5" />,
  file: (
    <>
      <path d="M14 2H4v20h16V8l-6-6Zm0 0v6h6M8 13h8m-8 4h5" />
    </>
  ),
};

export default function Icon({ name, className = '', size = 20, ...props }) {
  const content = paths[name] || paths.box;
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={size}
      height={size}
      aria-hidden="true"
      {...props}
    >
      {content}
    </svg>
  );
}
