import groq from 'groq';

export const POD_SLIDER = groq`
  pod {
    podId,
    numberOfProducts,
    itemID[],
    categoryID,
  },
  heading {
    heading,
    mobileAlignment,
    desktopAlignment,
  },
  displayOptions {
    showColorSwatches,
    cardsVisible,
  },
  _key,
  _type,
`;
