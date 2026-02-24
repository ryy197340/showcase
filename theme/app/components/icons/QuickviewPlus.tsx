type QuickviewPlusProps = {
  width?: number | string;
  height?: number | string;
  className?: string;
};

export default function QuickviewPlus({
  width = 34,
  height = 34,
  className = '',
}: QuickviewPlusProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="12" cy="12" r="12" fill="rgba(255, 255, 255, 0.5)" />

      {/* Vertical bar of plus */}
      <rect x="11" y="8.5" width="1.5" height="7" fill="#13294E" />

      {/* Horizontal bar of plus */}
      <rect x="8.5" y="11" width="7" height="1.5" fill="#13294E" />
    </svg>
  );
}
