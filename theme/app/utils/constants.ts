export const loadStatuses = {
  STALE: 0,
  LOADING: 1,
  SUCCESS: 2,
  FAILED: 3,
};

export type LoadStatus = (typeof loadStatuses)[keyof typeof loadStatuses];

export const COLLECTION_COLORS: Record<string, string> = {
  Animal: '#D3D3D3',
  Acorn: '#7C4D3A',
  'Amber Tortoise/Green': '#D2B48C',
  Black: '#000000',
  Blue: '#0000FF',
  Brown: '#A52A2A',
  'Classic Navy': '#000080',
  Camel: '#D2B48C',
  'Dark Brown': '#A52A2A',
  'Dark Denim': '#000080',
  'Dark Denim Blue': '#000080',
  'Dark Heather Grey': '#808080',
  'Dark Olive': '#808000',
  'Dark Navy': '#000080',
  'Egret White': '#F0EDE5',
  'French Blue': '#0000FF',
  Green: '#008000',
  Grey: '#808080',
  Gray: '#808080',
  'Heather Oatmeal': '#F0EDE5',
  'Heather Smoke': '#808080',
  Ivory: '#F0EDE5',
  Java: '#A52A2A',
  'Light Blue': '#ADD8E6',
  'Light Coffee': '#A52A2A',
  'Light Denim Blue': '#B0C4DE',
  'Light Grey': '#D3D3D3',
  'Light Grey Heather': '#D3D3D3',
  Metallic: '#D3D3D3',
  Mocha: '#A52A2A',
  Multi:
    'linear-gradient(to right, red,orange,yellow,green,blue,indigo,violet)',
  Navy: '#000080',
  Natural: '#C87021',
  Neutral: '#F0EDE5',
  Neutrals: '#F0EDE5',
  'Olive/Dark Brown': '#808000',
  Orange: '#FFA500',
  'Off White': '#F0EDE5',
  'Off White/Multi': '#F0EDE5',
  Pastels: 'linear-gradient(315deg, #f2f0ef 0%, #fbceb1 74%)',
  Pink: '#FFC0CB',
  'Pink/Coral': '#FFC0CB',
  Purple: '#800080',
  Red: '#FF0000',
  'Royal Blue/Light Aqua': '#0000FF',
  Tan: '#D2B48C',
  White: '#FFFFFF',
  'White/Blue': '#FFFFFF',
  Yellow: '#FFFF00',
  'Yellow/Red/Blue/Green': '#FFFF00',
};

// Product Grid Numbers
export const DEFAULT_PRODUCT_GRID_NUMBER = 36;
export const SECONDARY_PRODUCT_GRID_NUMBER = DEFAULT_PRODUCT_GRID_NUMBER * 2;
export const THIRD_PRODUCT_GRID_NUMBER = DEFAULT_PRODUCT_GRID_NUMBER * 3;

// Tailwind Breakpoints
export const MOBILE_WIDTH = 640;
export const SMALL_TABLET_WIDTH = 768;
export const LARGE_TABLET_WIDTH = 1024;
export const DESKTOP_WIDTH = 1280;
export const LARGE_DESKTOP_WIDTH = 1536;

export const XGEN_DEBUG_PARAM_NAME = 'debug_xgen';
export const XGEN_DEBUG_LOGS_PROPERTY_NAME = '__XGEN_DEBUG_LOGS';
