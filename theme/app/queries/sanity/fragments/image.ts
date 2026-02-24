import groq from 'groq';

export const IMAGE = groq`
  ...,
  "altText": asset->altText,
  "blurDataURL": asset->metadata.lqip,
  'height': asset->metadata.dimensions.height,
  'url': asset->url,
  'urlA': url,
  'width': asset->metadata.dimensions.width,
`;
