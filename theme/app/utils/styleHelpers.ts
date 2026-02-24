type Spacing = {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
};

type StyleSettings = {
  padding?: Spacing;
  margin?: Spacing;
  objectFit?: string;
};

const buildPaddingStyle = (padding?: Spacing) => {
  if (!padding) return {};
  return {
    ...(padding.top != null && {paddingTop: `${padding.top}px`}),
    ...(padding.right != null && {paddingRight: `${padding.right}px`}),
    ...(padding.bottom != null && {paddingBottom: `${padding.bottom}px`}),
    ...(padding.left != null && {paddingLeft: `${padding.left}px`}),
  };
};

const buildMarginStyle = (margin?: Spacing) => {
  if (!margin) return {};
  return {
    ...(margin.top != null && {marginTop: `${margin.top}px`}),
    ...(margin.right != null && {marginRight: `${margin.right}px`}),
    ...(margin.bottom != null && {marginBottom: `${margin.bottom}px`}),
    ...(margin.left != null && {marginLeft: `${margin.left}px`}),
  };
};

export const getImageStyle = (styleSettings?: StyleSettings) => {
  if (!styleSettings) return {};
  return {
    ...buildPaddingStyle(styleSettings.padding),
    ...buildMarginStyle(styleSettings.margin),
    ...(styleSettings.objectFit && {objectFit: styleSettings.objectFit}),
  };
};

export const hexToRgba = (color?: string) => {
  if (typeof color !== 'string') return '';

  // Match patterns like "#13294e" or "#13294e/0.77"
  const match = color.match(/^#([0-9a-fA-F]{6})(?:\/([\d.]+))?$/);
  if (!match) {
    return color; // return as-is if not matching
  }

  const hex = match[1];
  const alpha = match[2] ? parseFloat(match[2]) : 1;

  // Parse hex into r,g,b
  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
