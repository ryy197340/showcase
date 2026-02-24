import groq from 'groq';

import {IMAGE} from '../image'; // Assuming you have an image fragment

export const THREE_IMAGES_MODULE = groq`
   _type,
   images[] {
      ${IMAGE}
   },
   imageLoading
`;
