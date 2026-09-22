const PATHS = {
  "map-pin": "M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  calendar: "M8 2v3M16 2v3M3.5 9.5h17M5 4.5h14a1.5 1.5 0 0 1 1.5 1.5v13A1.5 1.5 0 0 1 19 20.5H5A1.5 1.5 0 0 1 3.5 19V6A1.5 1.5 0 0 1 5 4.5Z",
  users: "M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20M10 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM20 20v-1.5a3.5 3.5 0 0 0-2.5-3.35M15 4.6a3.5 3.5 0 0 1 0 6.8",
  ruler: "M3 16.5 16.5 3 21 7.5 7.5 21 3 16.5ZM7 13l2 2M10 10l2 2M13 7l2 2",
  ticket: "M3 9.5V7a1.5 1.5 0 0 1 1.5-1.5h15A1.5 1.5 0 0 1 21 7v2.5a2.5 2.5 0 0 0 0 5V17a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17v-2.5a2.5 2.5 0 0 0 0-5ZM13 5.5v13",
  heart: "M12 20.3 4.6 13a4.5 4.5 0 0 1 6.4-6.4l1 1 1-1a4.5 4.5 0 0 1 6.4 6.4L12 20.3Z",
  star: "m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1.1 5.9L12 16.9l-5.3 2.8 1.1-5.9-4.3-4.1 5.9-.8L12 3.5Z",
  menu: "M4 7h16M4 12h16M4 17h16",
  x: "M6 6l12 12M18 6 6 18",
  "arrow-left": "M19 12H5M11 6l-6 6 6 6",
  "arrow-right": "M5 12h14M13 6l6 6-6 6",
  external: "M14 4h6v6M20 4l-9 9M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5",
  sliders: "M4 6h10M18 6h2M4 12h3M11 12h9M4 18h12M20 18h0M14 3.5v5M7 9.5v5M16 15.5v5",
  search: "M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15ZM21 21l-5.2-5.2",
  route: "M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM18 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM8 17h6a3 3 0 0 0 0-6h-4a3 3 0 0 1 0-6h6",
  check: "m5 12 4.5 4.5L19 7",
  "chevron-down": "m6 9 6 6 6-6",
} as const;

export type IconName = keyof typeof PATHS;

export default function Icon({
  name,
  size = 18,
  filled = false,
  className = "",
}: {
  name: IconName;
  size?: number;
  filled?: boolean;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      viewBox="0 0 512 512"
      className="shrink-0"
    >
      <defs>
        <linearGradient id="bpmap-logo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6d28d9" />
          <stop offset="0.55" stopColor="#c026d3" />
          <stop offset="1" stopColor="#d946ef" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="112" fill="url(#bpmap-logo)" />
      <g fill="#ffffff">
        <rect x="156" y="252" width="40" height="120" rx="20" />
        <rect x="236" y="152" width="40" height="220" rx="20" />
        <rect x="316" y="282" width="40" height="90" rx="20" />
      </g>
    </svg>
  );
}
