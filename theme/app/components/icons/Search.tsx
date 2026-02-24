export default function SearchIcon({size}: {size?: string}) {
  return (
    <svg
      width={size || '25'}
      height={size || '25'}
      viewBox="0 0 25 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M11.75 20.5731C16.7206 20.5731 20.75 16.5437 20.75 11.5731C20.75 6.60256 16.7206 2.57312 11.75 2.57312C6.77944 2.57312 2.75 6.60256 2.75 11.5731C2.75 16.5437 6.77944 20.5731 11.75 20.5731Z"
        stroke="#13294E"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19.6804 21.2629C20.2104 22.8629 21.4204 23.0229 22.3504 21.6229C23.2004 20.3429 22.6404 19.2929 21.1004 19.2929C19.9604 19.2829 19.3204 20.1729 19.6804 21.2629Z"
        stroke="#13294E"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
