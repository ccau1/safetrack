interface LogoProps {
  iconSize?: number;
  textClassName?: string;
}

export function Logo({ iconSize = 20, textClassName = 'text-base font-bold text-[#1A1A1A]' }: LogoProps) {
  return (
    <div className="flex items-center gap-2">
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {/* Shield background fill */}
        <path
          d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
          fill="#4A5548"
          opacity="0.15"
        />
        {/* Shield outline */}
        <path
          d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
          stroke="#4A5548"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Person dot at the center of the radar */}
        <circle cx="12" cy="12.5" r="1.5" fill="#D97706" />
        {/* Inner tracking arc */}
        <path
          d="M9.5 11Q12 7.5 14.5 11"
          stroke="#D97706"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.7"
        />
        {/* Outer tracking arc */}
        <path
          d="M7.5 8.5Q12 2.5 16.5 8.5"
          stroke="#D97706"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.4"
        />
      </svg>
      <span className={textClassName}>SafeTrack</span>
    </div>
  );
}
