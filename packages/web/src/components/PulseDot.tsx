interface PulseDotProps {
  color?: string;
  size?: number;
}

export function PulseDot({ color = '#C44536', size = 10 }: PulseDotProps) {
  return (
    <span className="relative inline-flex items-center justify-center">
      <span
        className="absolute inline-flex rounded-full opacity-75 animate-ping"
        style={{
          width: size,
          height: size,
          backgroundColor: color,
          animationDuration: '2s',
        }}
      />
      <span
        className="relative inline-flex rounded-full"
        style={{
          width: size,
          height: size,
          backgroundColor: color,
        }}
      />
    </span>
  );
}
