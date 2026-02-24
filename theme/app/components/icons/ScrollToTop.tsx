export default function ScrollToTopIcon() {
  return (
    <svg className="scroll-to-top" viewBox="4 2 50 50" fill="none">
      <g filter="">
        <rect x="4" y="2" width="50" height="50" rx="25" fill="#327FEF" />
        <path
          d="M35 30L29 24L23 30"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="square"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <filter
          id="filter0_d_1020_106009"
          x="0"
          y="0"
          width="58"
          height="58"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="2" />
          <feGaussianBlur stdDeviation="2" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.26 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow_1020_106009"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow_1020_106009"
            result="shape"
          />
        </filter>
      </defs>
    </svg>
  );
}
