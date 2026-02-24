/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}'],
  safelist: [
    'p-0',
    'p-2',
    'p-4',
    'p-8',
    'p-12',
    'md:p-0',
    'md:p-2',
    'md:p-4',
    'md:p-8',
    'md:p-12',
    'h-auto',
    'h-full',
  ],
  theme: {
    boxShadow: {
      DEFAULT: '0px 0px 4px rgba(0, 0, 0, 0.1)',
    },
    fontFamily: {
      gotham: ['Gotham', 'sans'],
      hoefler: ['Hoefler Text', 'serif'],
      hevantica: ['Hevantica'],
      sans: '"DM Sans", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    },
    fontSize: {
      '3xs': '8px',
      '2xs': [
        '10px',
        {
          letterSpacing: '1px',
        },
      ],
      '1xs': '11px',
      xs: [
        '12px',
        {
          lineHeight: '1.5',
        },
      ],
      sm: '14px',
      md: [
        '16px',
        {
          lineHeight: '1.1',
        },
      ],
      lg: [
        '18px',
        {
          lineHeight: '1.1',
        },
      ],
      lg2: [
        '22px',
        {
          lineHeight: '1.1',
          fontFamily: 'hoefler',
        },
      ],
      lg3: [
        '24px',
        {
          lineHeight: '1.1',
          fontFamily: 'gotham',
        },
      ],
      xl: [
        '26px',
        {
          lineHeight: '1.1',
        },
      ],
      xl2: [
        '34px',
        {
          lineHeight: '34px',
        },
      ],
      '2xl': [
        '2.25rem',
        {
          lineHeight: '1.1',
        },
      ],
      '3xl': [
        '3.375rem',
        {
          lineHeight: '1',
        },
      ],
      '4xl': [
        '4.625rem',
        {
          lineHeight: '1',
        },
      ],
      '5xl': [
        '6.875rem',
        {
          lineHeight: '1',
        },
      ],
    },
    fontWeight: {
      light: 300,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    letterSpacing: {
      normal: '-0.03em',
    },
    lineHeight: {
      none: '1',
      field: '1.25',
      caption: '1.25',
      paragraph: '1.6',
      philanthropy: '30px',
    },
    extend: {
      colors: {
        primary: '#13294E',
        primaryLight: '#1E3D72',
        secondary: '#327FEF',
        cancelGray: '#666666',
        lightGray: '#E0E0E0',
        darkGray: '#383838',
        saleGray: '#AAAAAA',
        lineGray: '#CCCCCC',
        eeeeee: '#EEEEEE',
        optionGray: '#F7F6F2;',
        swatch: '#13294E',
        shopPay: '#5A31F4',
        gray: '#E7E7E7',
        otherGray: '#6C6C6C',
        otherBlack: '#141B3A',
        offBlack: '#2B2E2E',
        red: '#EC5039',
        sale: '#EE0700',
        badge: '#E2EBF8',
        messageBlue: '#F4F8FE',
        signupSuccessMsg: '#C8E1FF', // rgb(200, 225, 255)
        preorderMessage: '#A7A6A6',
      },
      height: {
        'header-sm': '4.375rem',
        'header-lg': '6.25rem',
      },
      spacing: {
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        5: '20px',
        6: '24px',
        7: '28px',
        8: '32px',
        9: '36px',
        10: '40px',
        11: '44px',
        12: '48px',
        13: '52px',
        14: '56px',
        15: '60px',
        16: '64px',
        17: '68px',
        18: '72px',
        19: '76px',
        20: '80px',
        21: '84px',
        22: '88px',
        23: '92px',
        24: '96px',
        25: '100px',
        26: '104px',
        27: '108px',
        28: '112px',
        29: '116px',
        30: '120px',
        31: '124px',
        32: '128px',
        33: '132px',
        34: '136px',
        35: '140px',
        36: '144px',
        37: '148px',
        38: '152px',
        39: '156px',
        40: '160px',
        overlap: '20px',
      },
      width: {
        '1/8': '12.5%',
        '3/8': '37.5%',
        '5/8': '62.5%',
        '7/8': '87.5%',
        'full-40': 'calc(100vw - 40px)',
        'full-vw': '100vw',
        32: '32%',
      },
      minHeight: {
        0: '0',
        '1/4': '25%',
        '1/2': '50%',
        '3/4': '75%',
        full: '100%',
        160: '160px',
        400: '400px',
        500: '500px',
        600: '600px',
      },
      maxHeight: {
        489: '489px',
      },
      maxWidth: {
        '1/4': '25%',
        '1/2': '50%',
        '3/4': '75%',
      },
    },
  },
  plugins: [
    function ({addUtilities}) {
      // Generate the .top-{i} utilities
      const newUtilities = {};
      for (let i = 1; i <= 100; i++) {
        newUtilities[`.top-${i}`] = {top: `${i}px`};
      }

      // Add the no-scrollbar utility
      const scrollbarUtilities = {
        '.no-scrollbar::-webkit-scrollbar': {
          display: 'none',
        },
        '.no-scrollbar': {
          '-ms-overflow-style': 'none' /* for Internet Explorer */,
          'scrollbar-width': 'none' /* for Firefox */,
        },
      };

      // Register utilities
      addUtilities(newUtilities, ['responsive']);
      addUtilities(scrollbarUtilities, ['responsive']);
    },
  ],
};
