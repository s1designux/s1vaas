interface LogoProps {
  size?: number;
  className?: string;
  /**
   * variant:
   *  - 'aperture' (default): 기존 육각형 렌즈. Sidebar/Topbar icon 호환용 (currentColor).
   *  - 'symbol'            : 새 brand symbol — 파란 tag 안에 흰 "S1". solid fill.
   *  - 'symbol-inverse'    : 다크 배경 reverse — 흰 tag 안에 파란 "S1".
   */
  variant?: 'aperture' | 'symbol' | 'symbol-inverse';
}

export function Logo({ size = 32, className, variant = 'aperture' }: LogoProps) {
  if (variant === 'symbol' || variant === 'symbol-inverse') {
    const inverse = variant === 'symbol-inverse';
    const tagFill = inverse ? '#FFFFFF' : 'var(--color-accent)';
    const txtFill = inverse ? 'var(--color-accent)' : '#FFFFFF';
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 64 64"
        width={size}
        height={size}
        role="img"
        aria-label="S1 Cloud symbol"
        className={className}
      >
        <path
          d="M12 4 H52 A8 8 0 0 1 60 12 V48 A8 8 0 0 1 52 56 H40 L44 64 L30 56 H12 A8 8 0 0 1 4 48 V12 A8 8 0 0 1 12 4 Z"
          fill={tagFill}
        />
        <text
          x="32"
          y="38"
          textAnchor="middle"
          fontFamily="'Pretendard Variable','Pretendard','Segoe UI',sans-serif"
          fontSize="22"
          fontWeight="800"
          fill={txtFill}
          letterSpacing="-0.02em"
        >
          S1
        </text>
      </svg>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 96 96"
      width={size}
      height={size}
      role="img"
      aria-label="S1 Cloud aperture hexagon"
      className={className}
    >
      <path
        d="M48 4 L86.1051 26 L86.1051 70 L48 92 L9.89489 70 L9.89489 26 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M48 24 L68.7846 36 L68.7846 60 L48 72 L27.2154 60 L27.2154 36 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeDasharray="4 2"
      />
      <circle cx="48" cy="48" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
