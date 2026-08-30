export default function Logo({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="1" y="1" width="22" height="22" fill="none" stroke="#111111" strokeWidth="2" />
      <path
        d="M6 12.5L10 16.5L18 7.5"
        fill="none"
        stroke="#E10600"
        strokeWidth="2.5"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}
